import express from 'express';
import mqttClient from '../../shared/mqtt-client.js';
const router = express.Router();

router.post('/create', (req, res) => {
    const payload = req.body;
    const correlationId = Date.now().toString();


    const requestTopic = 'request/patient/create';
    const responseTopic = `response/patient/created/${correlationId}`;

    mqttClient.publish(requestTopic, JSON.stringify({ correlationId, payload }), (err) => {
        if (err) {
            return res.status(500).json({ message: 'Failed to publish request to MQTT', error: err.message });
        }
        console.log(`Published request to topic: ${requestTopic}`);
    });

    mqttClient.subscribe(responseTopic, (err) => {
        if (err) {
            return res.status(500).json({ message: 'Failed to subscribe to MQTT response topic', error: err.message });
        }
        console.log(`Subscribed to response topic: ${responseTopic}`);
    });

    mqttClient.on('message', (topic, message) => {
        if (topic === responseTopic) {
            mqttClient.unsubscribe(responseTopic); 
            console.log(`Unsubscribed from response topic: ${responseTopic}`);
            
            const response = JSON.parse(message.toString());
            return res.status(response.status === 'success' ? 201 : 500).json(response);
        }
    });
});

export default router;
