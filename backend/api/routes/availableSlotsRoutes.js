import express from 'express';
import mqttClient from '../../shared/mqtt-client.js';

const router = express.Router();

router.get('/', (req, res) => {
    const { dentistId, date, location } = req.query;
    const correlationId = Date.now().toString();

    const requestTopic = 'request/available-appointments';
    const responseTopic = `response/available-appointments/${correlationId}`;

    // Construct the payload for the availability request
    const payload = { dentistId, date, location };
    console.log (payload);

    // Publish the request to the MQTT broker
    mqttClient.publish(requestTopic, JSON.stringify({ correlationId, payload }), (err) => {
        if (err) {
          console.error("Failed to publish fetch request", err);
          return res
            .status(500)
            .json({ message: "Failed to publish fetch request" });
        }
    });
    
    // Timeout after 5sec
    const timeout = setTimeout(() => {
        mqttClient.unsubscribe(responseTopic);
        return res
            .status(504)
            .json({ message: "Request timeout. No response from server." });
    }, 5000);
  

    // Subscribe to the response topic
    mqttClient.subscribe(responseTopic, (err) => {
        if (err) {
          clearTimeout(timeout);
          console.error("Failed to subscribe to response topic", err);
          return res
            .status(500)
            .json({ message: "Failed to subscribe to response topic" });
        }
    });

    // Listen for the response message
    mqttClient.on('message', (topic, message) => {
        if (topic === responseTopic) {
            clearTimeout(timeout);
            mqttClient.unsubscribe(responseTopic); // Unsubscribe after receiving the response
            const response = JSON.parse(message.toString());
            const status = response.status === 'success' ? 200 : 404;
            res.status(status).json(response);
        }
    });
});

export default router;
