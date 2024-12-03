import Patient from '../models/patient.js';
import mqttClient from '../../../shared/mqtt-client.js';
import bcrypt from 'bcrypt';

export const createPatient = async (topic, message) => {
    const patientTopic = 'request/patients/create'; 

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

        const { firstName, lastName, SSN, email, password, phoneNumber} = parsedMessage.payload;

        if (!firstName || !lastName || !SSN || !email || !phoneNumber ) {
            const errorResponse ={
                correlationId, 
                status: 'error', 
                message : 'All fields are required', 
            }; 

            return publishResponse(correlationId, errorResponse);
        }

        const existingPatient = await Patient.findOne({ SSN });
        if ( existingPatient ) {
            const errorResponse ={
                correlationId, 
                status: 'error', 
                message : 'Patient already registred.', 
            }; 

            return publishResponse(correlationId, errorResponse);
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newPatient = new Patient({ 
            firstName, 
            lastName,
            SSN, 
            email, 
            password: hashedPassword, 
            phoneNumber 
        });

        await newPatient.save();

        const successResponse = {
            correlationId, 
            status: 'success', 
            message: 'Patient created successfully', 
            newPatient,
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
    const responseTopic = `response/patients/created/${correlationId}`;
    mqttClient.publish(responseTopic, JSON.stringify(response), (err) => {
        if (err) {
            console.error(`Failed to publish to ${responseTopic}:`, err);
        } else {
            console.log(`Response sent to ${responseTopic}`);
        }
    });
};
