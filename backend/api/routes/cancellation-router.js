import express from 'express'; 
import mqttClient from '../../shared/mqtt-client.js';

const router = express.Router(); 

router.patch('/', (req,res) => {
    const payload = req.body; 
    const correlationId = Date.now().toString(); 

    const requestTopic = 'request/appointments/cancel';
    const responseTopic = `response/appointments/canceled/${correlationId}`;

    mqttClient.publish(requestTopic,JSON.stringify({correlationId,payload})); 
    mqttClient.subscribe(responseTopic); 

    mqttClient.on('message', (topic, message)=> {
        if(topic === responseTopic){
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