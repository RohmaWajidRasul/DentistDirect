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
    
    let messageReceived = false;
    mqttClient.on('message', (topic, message) => {
        if (topic === responseTopic) {
            messageReceived = true;
            mqttClient.unsubscribe(responseTopic); 
            const response = JSON.parse(message.toString());
            res.status(response.status === 'success' ? 201 : 500).json(response);
        }
    });

    let counter = 0;
    var timer = setInterval(function() {

        counter++;
        if (messageReceived) {
            clearInterval(timer);
        }
        else if(counter === 5) {
            clearInterval(timer);
            mqttClient.unsubscribe(responseTopic); 
            res.status(500).json({ "Message" : "Server error" })
        }

    }, 1000)
});

export default router;
