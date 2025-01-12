import Dentist from '../models/dentist.js';
import mqttClient from '../../../shared/mqtt-client.js';
import bcrypt from 'bcrypt';

let requestTime;
let requestTopic;

export const registerDentist = async (topic, message) => {

    let correlationId; 

    try {
        requestTime = Date.now();
        requestTopic = topic;
        let parsedMessage;
        try {
            parsedMessage = JSON.parse(message.toString());
        } catch (error) {
            const errorResponse = {
                correlationId,
                status: 'error',
                message: 'Invalid JSON format in request',
                error
            };
            return publishResponse(correlationId, errorResponse);
        }
        correlationId = parsedMessage.correlationId;

        if (!correlationId) {
            throw new Error('Correlation ID is missing in the request');
        }

        const { firstName, lastName, email, password, phoneNumber, specialization, clinicId} = parsedMessage.payload;

        if (!firstName || !lastName || !email || !password || !phoneNumber || !specialization || !clinicId) {
            const errorResponse ={
                correlationId, 
                status: 'error', 
                message : 'All fields are required', 
            }; 

            return publishResponse(correlationId, errorResponse);
        }

        // Out of bounds validation for phone number
        if (phoneNumber.length < 10 || phoneNumber.length > 15) {
            const errorResponse = {
                correlationId,
                status: 'error',
                message: 'Phone number should be between 10 and 15 characters.',
            };
            return publishResponse(correlationId, errorResponse);
        }

        // Password validation
        if (password.length < 8) {
            const errorResponse = {
                correlationId,
                status: 'error',
                message: 'Password must be at least 8 characters long.',
            };
            return publishResponse(correlationId, errorResponse);
        }


        const dentist = await Dentist.findOne({ email });
        if ( dentist ) {
            const errorResponse ={
                correlationId, 
                status: 'error', 
                message : 'Email already in use.', 
            }; 

            return publishResponse(correlationId, errorResponse);
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newDentist = new Dentist({ firstName, lastName, email, password: hashedPassword, phoneNumber, specialization, clinicId });
        await newDentist.save();

        const successResponse = {
            correlationId, 
            status: 'success', 
            message: 'Dentist registered successfully', 
            newDentist,
        }; 
        return publishResponse(correlationId, successResponse);

    } catch (error) {
        if(!correlationId){
            console.error('Error: Correlation ID is missing', error.message); 
            return; 
        }

        const errorResponse ={
            correlationId, 
            status : 'error', 
            message: 'Error registering dentist', 
            error: error.message, 
        }; 
        return publishResponse(correlationId, errorResponse);
    }
    
};

const publishResponse = (correlationId, response) => {
    const responseTopic = `response/register-dentist/${correlationId}`;
    mqttClient.publish(responseTopic, JSON.stringify(response), (err) => {
        if (err) {
            console.error(`Failed to publish to ${responseTopic}:`, err);
        } else {
            console.log(`Response sent to ${responseTopic}`);
        }
    });
    log(response.status)
};

const log = (result) => {
    try {
        const logTopic = "request/create-log"
        const topicParts = requestTopic.split("/");
        const serviceName = topicParts[1] + " ";
        const serviceId = topicParts[2];
  
        const payload =  {
            result,
            serviceId,
            serviceName,
            requestTime,
            

        }
          const correlationId = Date.now();
          const logMessage = {
          correlationId,
          payload
        };
      

        mqttClient.publish(logTopic, JSON.stringify(logMessage), (err) => {
            if (err) {
                console.error(`Failed to publish to ${logTopic}:`, err);
            } else {
                console.log(`Request sent to ${logTopic}`);
            }
        });
    } catch(error) {
        console.log(error)
    }
}