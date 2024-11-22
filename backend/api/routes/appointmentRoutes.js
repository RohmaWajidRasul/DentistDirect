import express from 'express';
import mqttClient from '../../shared/mqtt-client.js';

const router = express.Router();

router.post('/create', (req, res) => {
    const payload = req.body;
    const correlationId = Date.now().toString();

    const requestTopic = 'request/appointments/create';
    const responseTopic = `response/appointments/created/${correlationId}`;

    mqttClient.publish(requestTopic, JSON.stringify({ correlationId, payload }));

    mqttClient.subscribe(responseTopic);
    

    var timeout = setTimeout(function() {

        mqttClient.unsubscribe(responseTopic);
        return res.status(504).json({ message : "Request timeout. No response from server"})

    }, 5000)

    mqttClient.subscribe(responseTopic, (err) => {
        if (err) {
          clearTimeout(timeout);
          console.error("Failed to subscribe to response topic", err);
          return res
            .status(500)
            .json({ message: "Failed to subscribe to response topic" });
        }
    });
  

    mqttClient.on('message', (topic, message) => {
        if (topic === responseTopic) {
            clearTimeout(timeout);
            mqttClient.unsubscribe(responseTopic); 
            const response = JSON.parse(message.toString());
            res.status(response.status === 'success' ? 201 : 500).json(response);
        }
    });
});

export default router;
