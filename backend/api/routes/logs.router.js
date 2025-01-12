import express from 'express';
import mqttClient from '../../shared/mqtt-client.js';
const router = express.Router();

router.get('/users', (req, res) => {
    const payload = {};
    const correlationId = Date.now().toString();

    const requestTopic = 'request/get-usernumbers';
    const responseTopic = `response/get-usernumbers/${correlationId}`;

    mqttClient.publish(requestTopic, JSON.stringify({ correlationId, payload }), (err) => {
        if (err) {
            return res.status(500).json({ message: 'Failed to publish get request to MQTT', error: err.message });
        }
        console.log(`Published get usernumbers request to topic: ${requestTopic}`);
    });

    const timeout = setTimeout(() => {
        mqttClient.unsubscribe(responseTopic);
        return res.status(504).json({ message: 'Usernumbers request timeout. No response from server.' });
    }, 5000);

    mqttClient.subscribe(responseTopic, (err) => {
        if (err) {
            clearTimeout(timeout);
            console.error(`Failed to subscribe to response topic: ${responseTopic}`, err);
            return res.status(500).json({ message: 'Failed to subscribe to MQTT response topic', error: err.message });
        }
        console.log(`Subscribed to response topic: ${responseTopic}`);
    });

    mqttClient.once('message', (topic, message) => {
        if (topic === responseTopic) {
            clearTimeout(timeout);
            mqttClient.unsubscribe(responseTopic);
            console.log(`Unsubscribed from response topic: ${responseTopic}`);

            const response = JSON.parse(message.toString());
            return res.status(response.status === 'success' ? 200 : 401).json(response);
        }
    });
});

router.get('/', (req, res) => {
    const payload = {};
    const correlationId = Date.now().toString();

    const requestTopic = 'request/get-logs';
    const responseTopic = `response/get-logs/${correlationId}`;

    mqttClient.publish(requestTopic, JSON.stringify({ correlationId, payload }), (err) => {
        if (err) {
            return res.status(500).json({ message: 'Failed to publish get request to MQTT', error: err.message });
        }
        console.log(`Published Get Logs request to topic: ${requestTopic}`);
    });

    const timeout = setTimeout(() => {
        mqttClient.unsubscribe(responseTopic);
        return res.status(504).json({ message: 'Get Logs request timeout. No response from server.' });
    }, 5000);

    mqttClient.subscribe(responseTopic, (err) => {
        if (err) {
            clearTimeout(timeout);
            console.error(`Failed to subscribe to response topic: ${responseTopic}`, err);
            return res.status(500).json({ message: 'Failed to subscribe to MQTT response topic', error: err.message });
        }
        console.log(`Subscribed to response topic: ${responseTopic}`);
    });

    mqttClient.once('message', (topic, message) => {
        if (topic === responseTopic) {
            clearTimeout(timeout);
            mqttClient.unsubscribe(responseTopic);
            console.log(`Unsubscribed from response topic: ${responseTopic}`);

            const response = JSON.parse(message.toString());
            return res.status(response.status === 'success' ? 200 : 401).json(response);
        }
    });
});

export default router;
