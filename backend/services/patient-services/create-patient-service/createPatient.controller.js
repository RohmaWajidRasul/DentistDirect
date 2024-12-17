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

        const { firstName, lastName, SSN, email, password, phoneNumber} = parsedMessage.payload;

        // Check required fields
        if (!firstName || !lastName || !SSN || !email || !phoneNumber || !password) {
            const errorResponse = {
                correlationId,
                status: 'error',
                message: 'All fields are required',
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

        // SSN validation (length check)
        if (SSN.length !== 10 && SSN.length !== 12) {
            const errorResponse = {
                correlationId,
                status: 'error',
                message: 'SSN must be in YYMMDDXXXX format or YYYYMMDDXXXX format',
            };
            return publishResponse(correlationId, errorResponse);
        }

        // Check if patient already exists
        const existingPatient = await Patient.findOne({ SSN });
        if ( existingPatient ) {
            const errorResponse ={
                correlationId, 
                status: 'error', 
                message : 'Patient already registered.', 
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
            status: 'error', 
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
