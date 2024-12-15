import bcrypt from 'bcrypt';
import Patient from '../models/patient.js';
import mqttClient from '../../../shared/mqtt-client.js';

export const loginPatient = async (topic, message) => {
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

        const { email, password } = parsedMessage.payload;

        if (!email || !password) {
            const errorResponse = {
                correlationId,
                status: 'error',
                message: 'Email and password are required',
            };
            return publishResponse(correlationId, errorResponse);
        }

        const patient = await Patient.findOne({ email });
        if (!patient) {
            const errorResponse = {
                correlationId,
                status: 'error',
                message: 'Invalid email or password',
            };
            return publishResponse(correlationId, errorResponse);
        }

        const isPasswordValid = await bcrypt.compare(password, patient.password);
        if (!isPasswordValid) {
            const errorResponse = {
                correlationId,
                status: 'error',
                message: 'Invalid email or password',
            };
            return publishResponse(correlationId, errorResponse);
        }

        const successResponse = {
            correlationId,
            status: 'success',
            message: 'Login successful',
            patient,
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
            message: 'Error during login',
            error: error.message,
        };
        return publishResponse(correlationId, errorResponse);
    }
};

const publishResponse = (correlationId, response) => {
    const responseTopic = `response/patient-login/${correlationId}`;
    mqttClient.publish(responseTopic, JSON.stringify(response), (err) => {
        if (err) {
            console.error(`Failed to publish to ${responseTopic}:`, err);
        } else {
            console.log(`Response sent to ${responseTopic}`);
        }
    });
};
