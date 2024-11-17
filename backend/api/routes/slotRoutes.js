import express from 'express';
import mqttClient from '../../shared/mqtt-client.js';

const router = express.Router();

router.post('/create', (req, res) => {
    const payload = req.body;
    const correlationId = Date.now().toString();

    const requestTopic = 'request/slots/create';
    const responseTopic = `response/slots/created/${correlationId}`;

    mqttClient.publish(requestTopic, JSON.stringify({ correlationId, payload }));

    mqttClient.subscribe(responseTopic);

    mqttClient.on('message', (topic, message) => {
        if (topic === responseTopic) {
            mqttClient.unsubscribe(responseTopic); 
            const response = JSON.parse(message.toString());
            res.status(response.status === 'success' ? 201 : 500).json(response);
        }
    });
});

export default router;
