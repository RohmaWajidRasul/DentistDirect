import Clinic from '../models/clinic.js';
import mqttClient from '../../../shared/mqtt-client.js';

let requestTime;
let requestTopic;

export const registerClinic = async (topic, message) => {

    let correlationId; 

    try {
        let parsedMessage;
        requestTime = Date.now();
        requestTopic = topic;
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

        const { name, location, latitude, longitude } = parsedMessage.payload;

        // Validation for all required fields
        if (!name || !location || latitude === undefined || longitude === undefined) {
            const errorResponse = {
                correlationId, 
                status: 'error', 
                message: 'All fields are required.', 
            }; 
            return publishResponse(correlationId, errorResponse);
        }

        // Check if a clinic already exists with the same name and location
        const existingClinic = await Clinic.findOne({ name, location });
        if (existingClinic) {
            const errorResponse = {
                correlationId, 
                status: 'error', 
                message: 'Clinic already exists.', 
            }; 
            return publishResponse(correlationId, errorResponse);
        }

        // Create a new clinic
        const newClinic = new Clinic({ name, location, latitude, longitude });
        await newClinic.save();

        const successResponse = {
            correlationId, 
            status: 'success', 
            message: 'Clinic registered successfully.', 
            newClinic,
        }; 
        return publishResponse(correlationId, successResponse);

    } catch (error) {
        if (!correlationId) {
            console.error('Error: Correlation ID is missing', error.message); 
            return; 
        }

        const errorResponse = {
            correlationId, 
            status: 'error', 
            message: 'Error registering clinic.', 
            error: error.message, 
        }; 
        return publishResponse(correlationId, errorResponse);
    }
};

const publishResponse = (correlationId, response) => {
    const responseTopic = `response/register-clinic/${correlationId}`;
    mqttClient.publish(responseTopic, JSON.stringify(response), (err) => {
        if (err) {
            console.error(`Failed to publish to ${responseTopic}:`, err);
        } else {
            console.log(`Response sent to ${responseTopic}`);
        }
    });
    log(response.status);
};

const log = (result) => {
    try {
        const logTopic = "request/create-log"
        const topicParts = requestTopic.split("/");
        const serviceName = topicParts[1];
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
