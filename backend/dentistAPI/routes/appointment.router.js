import express from 'express';
import mqttClient from '../../shared/mqtt-client.js';

const router = express.Router();

router.post('/', (req, res) => {
    const payload = req.body;
    const correlationId = Date.now().toString();

    const requestTopic = 'request/appointments/create';
    const responseTopic = `response/appointments/created/${correlationId}`;

    let responded = false;

    mqttClient.subscribe(responseTopic, (err) => {
        if (err) {
            console.error('Failed to subscribe to response topic:', err);
            return res.status(500).json({ message: 'Subscription error' });
        }
    });

    mqttClient.publish(requestTopic, JSON.stringify({ correlationId, payload }), (err) => {
        if (err) {
            console.error('Failed to publish message:', err);
            return res.status(500).json({ message: 'Publish error' });
        }
    });

    const timeout = setTimeout(() => {
        if (!responded) {
            responded = true;
            mqttClient.unsubscribe(responseTopic);
            return res.status(504).json({ message: 'Request timeout. No response from server.' });
        }
    }, 5000);

    mqttClient.once('message', (topic, message) => {
        if (!responded && topic === responseTopic) {
            responded = true;
            clearTimeout(timeout);
            mqttClient.unsubscribe(responseTopic);

            const response = JSON.parse(message.toString());
            return res.status(response.status === 'success' ? 201 : 404).json(response);
        }
    });
});


router.patch("/:appointmentId", (req, res) => {
    const { appointmentId } = req.params;
    const { status } = req.body;

    if (!["canceled", "deleted"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
    }

    const correlationId = Date.now().toString();

    let requestTopic;
    let responseTopic;

    if (status === "canceled") {
        requestTopic = "request/appointments/manage/cancel";
        responseTopic = `response/appointments/manage/canceled/${correlationId}`;
    } else if (status === "deleted") {
        requestTopic = "request/appointments/manage/delete";
        responseTopic = `response/appointments/manage/deleted/${correlationId}`;
    }

    const payload = { appointmentId, ...req.body };
  
    mqttClient.publish(requestTopic, JSON.stringify({ correlationId, payload }), (err) => {
        if (err) {
            console.error("Failed to publish request", err);
            return res
                .status(500)
                .json({ message: "Failed to publish request" });
        }
    });
  
    const timeout = setTimeout(() => {
        mqttClient.unsubscribe(responseTopic);
        return res
          .status(504)
          .json({ message: "Request timeout. No response from server." });
    }, 5000);
    
    mqttClient.subscribe(responseTopic, (err) => {
        if (err) {
            clearTimeout(timeout);
            console.error("Failed to subscribe to response topic", err);
            return res
                .status(500)
                .json({ message: "Failed to subscribe to response topic" });
        }  
    });
  
    mqttClient.on("message", (topic, message) => {
        if (topic === responseTopic) {
          clearTimeout(timeout);
          mqttClient.unsubscribe(responseTopic);

          const response = JSON.parse(message.toString());

          const statusCode = response.status === "success" ? 200 : 404;
          return res.status(statusCode).json(response);
        }  
    });
});

export default router;
