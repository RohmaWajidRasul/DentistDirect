import express from 'express'; 
import mqttClient from '../../shared/mqtt-client.js';

const router = express.Router(); 

router.patch('/', (req,res) => {
    const payload = req.body; 
    const correlationId = Date.now().toString(); 

    const requestTopic = 'request/appointments/cancel';
    const responseTopic = `response/appointments/canceled/${correlationId}`;

    mqttClient.publish(requestTopic,JSON.stringify({correlationId, payload}), (err) => {
        if (err){
            console.error('Failed to publish cancel to request', err);
            return res.status(500).json({ message: 'Failed to publish cancel request to MQTT', error: err.message });
        } else {
            console.log(`Published request to topic: ${requestTopic}`);
        }
    }); 

    const timeout = setTimeout(() => {
        mqttClient.unsubscribe (responseTopic);
        return res.status(504).json({ message: 'Request timeout. No response from server.' });
    }, 5000);
        

    mqttClient.subscribe(responseTopic, (err) => {
        if (err) {
            clearTimeout(timeout); 
            console.error(`Failed to subscribe to topic: ${responseTopic}`, err);
            return res.status(500).json({ message: 'Failed to subscribe to response topic'});
        }
    }),
    

    mqttClient.on('message', (topic, message)=> {
        if(topic === responseTopic) {
            clearTimeout(timeout); 
            mqttClient.unsubscribe(responseTopic);  
            const response = JSON.parse(message.toString()); 
            
            let statusCode;

            if (response.status === 'success') {
                statusCode = 200;
            } else if (response.status === 'not_found') {
                statusCode = 404;
            } else {
                statusCode = 500;
            }

            res.status(statusCode).json(response);

        }
    });
}); 

export default router;