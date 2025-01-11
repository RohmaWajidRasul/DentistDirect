import Patient from '../models/patient.js';
import mqttClient from '../../../shared/mqtt-client.js';
import bcrypt from 'bcrypt';


export const managePatient = async (topic, message) => {
    console.log(`Request received on topic: ${topic}`);

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
                error: error.message,
            };
            return publishResponse(correlationId, errorResponse);
        }

        correlationId = parsedMessage.correlationId;

        if (!correlationId) {
            throw new Error('Correlation ID is missing in the request');
        }

        const { patientId, ...updates } = parsedMessage.payload || {};

        if (!patientId) {
            const errorResponse = {
                correlationId,
                status: 'error',
                message: 'Patient ID is required',
            };
            return publishResponse(correlationId, errorResponse);
        }

        const patient = await Patient.findById(patientId);

        if (!patient) {
            const errorResponse = {
                correlationId,
                status: 'error',
                message: 'Patient not found',
            };
            return publishResponse(correlationId, errorResponse);
        }

        for (const [key, value] of Object.entries(updates)) {
            if (key === "SSN") {        
                const errorResponse = {
                    correlationId, 
                    status: 'error', 
                    message: 'Cannot change SSN', 
                }; 
                return publishResponse(correlationId, errorResponse);
                
            } else if (key === "preferences") {

                //console.log(key, value);

                const updatedPreferences = {
                    dateRange: value.dateRange || { startDate: null, endDate: null }, 
                    dentist: value.dentist || null,
                    specialization: value.specialization || '', 
                    clinic: value.clinic || null 
                };
                
                patient.preferences = updatedPreferences;
                
            } else if (key === "password") {
                if (value.length < 8) {
                    const errorResponse = {
                        correlationId,
                        status: 'error',
                        message: 'Password must be at least 8 characters long.',
                    };
                    return publishResponse(correlationId, errorResponse);
                }

                const hashedPassword = await bcrypt.hash(value, 10);
                patient.password = hashedPassword;

            } else if (key in patient) {
                patient[key] = value;
            } else {
                const errorResponse = {
                    correlationId,
                    status: 'error',
                    message: `Invalid field: ${key}`,
                };
                return publishResponse(correlationId, errorResponse);
            }
        }

        await patient.save();

        const successResponse = {
            correlationId,
            status: 'success',
            message: 'Patient updated successfully',
            patient,
        };
        return publishResponse(correlationId, successResponse);
    } catch (error) {
        if (!correlationId) {
            console.error('Critical error: Correlation ID is missing or undefined.', error.message);
            return;
        }

        const errorResponse = {
            correlationId,
            status: 'error',
            message: 'Error processing request',
            error: error.message,
        };
        return publishResponse(correlationId, errorResponse);
    }
};



const publishResponse = (correlationId, response) => {
    let responseTopic;
    responseTopic = `response/manage-patient/${correlationId}`
   
    mqttClient.publish(responseTopic, JSON.stringify(response), (err) => {
        if (err) {
            console.error(`Failed to publish to ${responseTopic}:`, err);
        } else {
            console.log(`Response sent to ${responseTopic}`);
        }
    });
};

