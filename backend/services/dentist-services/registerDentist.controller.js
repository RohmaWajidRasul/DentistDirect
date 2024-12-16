import Dentist from './models/dentist.js';
import mqttClient from '../../shared/mqtt-client.js';
import bcrypt from 'bcrypt';


export const registerDentist = async (topic, message) => {
    const dentistTopic = 'request/dentists/register'; 

    if (topic !== dentistTopic){
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

        const { firstName, lastName, email, password, phoneNumber, specialization, location } = parsedMessage.payload;

        if (!firstName || !lastName || !email || !password || !phoneNumber || !specialization || !location) {
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

        const newDentist = new Dentist({ firstName, lastName, email, password: hashedPassword, phoneNumber, specialization, location });
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
    const responseTopic = `response/dentists/registered/${correlationId}`;
    mqttClient.publish(responseTopic, JSON.stringify(response), (err) => {
        if (err) {
            console.error(`Failed to publish to ${responseTopic}:`, err);
        } else {
            console.log(`Response sent to ${responseTopic}`);
        }
    });
};