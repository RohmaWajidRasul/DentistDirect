import express from 'express';
import mqttClient from '../../shared/mqtt-client.js';

const router = express.Router();

router.post('/', (req, res) => {
    const payload = req.body;
    const correlationId = Date.now().toString();

    const requestTopic = 'request/register-clinic';
    const responseTopic = `response/register-clinic/${correlationId}`;


    // Publish request to MQTT
    mqttClient.publish(requestTopic, JSON.stringify({ correlationId, payload }), (err) => {
        if (err) {
            return res.status(500).json({ message: 'Failed to publish request to MQTT', error: err.message });
        }
        console.log(`Published request to topic: ${requestTopic}`);
    });

    // Set timeout for response
    const timeout = setTimeout(() => {
        mqttClient.unsubscribe(responseTopic);
        return res.status(504).json({ message: 'Request timeout. No response from server.' });
    }, 5000);

    // Subscribe to the response topic
    mqttClient.subscribe(responseTopic, (err) => {
        if (err) {
            clearTimeout(timeout);
            return res.status(500).json({ message: 'Failed to subscribe to MQTT response topic', error: err.message });
        }
        console.log(`Subscribed to response topic: ${responseTopic}`);
    });

    // Handle incoming messages
    mqttClient.on('message', (topic, message) => {
        if (topic === responseTopic) {
            clearTimeout(timeout);
            mqttClient.unsubscribe(responseTopic);
            console.log(`Unsubscribed from response topic: ${responseTopic}`);

            const response = JSON.parse(message.toString());
            res.status(response.status === 'success' ? 201 : 500).json(response);
        }
    })
});


router.post('/retrieve', (req, res) => {
  const payload = req.body;
  const correlationId = Date.now().toString();

  const requestTopic = 'request/retrieve-clinics'; 
  const responseTopic = `response/retrieve-clinics/${correlationId}`;

  mqttClient.publish(requestTopic, JSON.stringify({ correlationId, payload }), (err) => {
      if (err) {
          return res.status(500).json({ message: 'Failed to publish request to MQTT', error: err.message });
      }
      console.log(`Published request to topic: ${requestTopic}`);
  });

  const timeout = setTimeout(() => {
      mqttClient.unsubscribe(responseTopic);
      return res.status(504).json({ message: 'Request timeout. No response from server.' });
  }, 5000);

  mqttClient.subscribe(responseTopic, (err) => {
      if (err) {
          clearTimeout(timeout);
          return res.status(500).json({ message: 'Failed to subscribe to MQTT response topic', error: err.message });
      }
      console.log(`Subscribed to response topic: ${responseTopic}`);
  });

  mqttClient.on('message', (topic, message) => {
      if (topic === responseTopic) {
          clearTimeout(timeout);
          mqttClient.unsubscribe(responseTopic);
          console.log(`Unsubscribed from response topic: ${responseTopic}`);

          const response = JSON.parse(message.toString());
          res.status(response.status === 'success' ? 200 : 500).json(response);
      }
  });
});

export default router;
