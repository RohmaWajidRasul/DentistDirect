import Clinic from "../models/clinic.js";
import mqttClient from "../../../shared/mqtt-client.js";

export const retrieveClinics = async(topic, message) => {
    let correlationId; 
    try {
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
        if(!correlationId){
            throw new Error('Correlation ID is missing in the request');
        }

        const { name , location } = parsedMessage.payload || {}; 
      
        const query = {};
         if (name){
            query.name = name; 
        }
        if(location){
            query.location = location; 
        }

        const clinics = await Clinic.find(query); 
        
        const successResponse = {
            correlationId,
            status: 'success',
            message: 'Clinics retrieved successfully.',
            clinics
        };
        return publishResponse(correlationId, successResponse);
    }
    catch (error){
        if (!correlationId) {
            console.error('Error: Correlation ID is missing', error.message);
            return;
        }

        const errorResponse = {
            correlationId,
            status: 'error',
            message: 'Error retrieving clinics.',
            error: error.message,
        };
        return publishResponse(correlationId, errorResponse);
    }
};

const publishResponse = (correlationId, response) => {
    const responseTopic = `response/retrieve-clinics/${correlationId}`;
    mqttClient.publish(responseTopic, JSON.stringify(response), (err) => {
        if (err) {
            console.error(`Failed to publish to ${responseTopic}:`, err);
        } else {
            console.log(`Response sent to ${responseTopic}`);
        }
    });
};
