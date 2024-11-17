import express from 'express';
import mqttClient from '../../shared/mqtt-client.js';

const router = express.Router();

router.get('/:dentistId', (req, res) => {
    const { dentistId } = req.params;
    const date = req.query.date;
    const correlationId = Date.now().toString();

    const requestTopic = 'request/availability/fetch';
    const responseTopic = `response/availability/fetched/${correlationId}`;

    // Construct the payload for the availability request
    const payload = { dentistId, date };

    // Publish the request to the MQTT broker
    mqttClient.publish(requestTopic, JSON.stringify({ correlationId, payload }));

    // Subscribe to the response topic
    mqttClient.subscribe(responseTopic);

    // Listen for the response message
    mqttClient.on('message', (topic, message) => {
        if (topic === responseTopic) {
            mqttClient.unsubscribe(responseTopic); // Unsubscribe after receiving the response
            const response = JSON.parse(message.toString());
            const status = response.status === 'success' ? 200 : 404;
            res.status(status).json(response);
        }
    });
});

export default router;
