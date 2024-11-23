import Patient from '../models/patient.js';
import mqttClient from '../../shared/mqtt-client.js';

export const createPatientRequest = async (topic, message) => {
    const patientTopic = 'request/patient/create'; 

    if (topic !== patientTopic){
        return; 
    }

    let correlationId; 


    try {
        const parsedMessage = JSON.parse(message.toString());
        correlationId = parsedMessage.correlationId;

        if (!correlationId) {
            throw new Error('Correlation ID is missing in the request');
        }


        const { firstName, lastName, email, phoneNumber, dateOfBirth } = parsedMessage.payload;

        if (!firstName || !lastName || !email || !phoneNumber || !dateOfBirth ) {
            const errorResponse ={
                correlationId, 
                status: 'error', 
                message : 'All fields are required', 
            }; 

            return publishResponse(correlationId, errorResponse);
        }

        const patient = new Patient({ firstName, lastName, email, phoneNumber, dateOfBirth });
        await patient.save();

        const successResponse = {
            correlationId, 
            status: 'success', 
            message: 'Patient created successfully', 
            patient,
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
            message: 'Error creating patient', 
            error: error.message, 
        }; 
        return publishResponse(correlationId, errorResponse);
    }
    
};

const publishResponse = (correlationId, response) => {
    const responseTopic = `response/patient/created/${correlationId}`;
    mqttClient.publish(responseTopic, JSON.stringify(response), (err) => {
        if (err) {
            console.error(`Failed to publish to ${responseTopic}:`, err);
        } else {
            console.log(`Response sent to ${responseTopic}`);
        }
    });
};
