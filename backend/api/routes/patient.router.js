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

    const timeout = setTimeout (() => {
        mqttClient.unsubscribe(responseTopic);
        return res.status(504).json({ message: 'Request timeout. No response from server.' });
    }, 5000);

    mqttClient.subscribe(responseTopic, (err) => {
        if (err) {
            clearTimeout(timeout); 
            console.error(`Failed to subscribe to topic: ${responseTopic}`, err);
            return res.status(500).json({ message: 'Failed to subscribe to MQTT response topic', error: err.message });
        } else {
            console.log(`Subscribed to response topic: ${responseTopic}`);
        }
    });

    mqttClient.on('message', (topic, message) => {
        if (topic === responseTopic) {
            clearTimeout(timeout); 
            mqttClient.unsubscribe(responseTopic); 
            console.log(`Unsubscribed from response topic: ${responseTopic}`);
            
            const response = JSON.parse(message.toString());
            return res.status(response.status === 'success' ? 201 : 500).json(response);
        }
    });
});
export default router;
