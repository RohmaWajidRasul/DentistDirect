import Appointment from '../models/appointment.js';
import mqttClient from '../../../shared/mqtt-client.js';

export const manageAppointment = async (topic, message) => {
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

        const { appointmentId, ...updates } = parsedMessage.payload || {};

        if (!appointmentId) {
            const errorResponse = {
                correlationId,
                status: 'error',
                message: 'Appointment ID is required',
            };
            return publishResponse(correlationId, errorResponse);
        }

        const appointment = await Appointment.findById(appointmentId);

        if (!appointment) {
            const errorResponse = {
                correlationId,
                status: 'error',
                message: 'Appointment not found',
            };
            return publishResponse(correlationId, errorResponse);
        }

        // Update fields dynamically based on provided keys
        for (const [key, value] of Object.entries(updates)) {
            if (key === "status") {
                switch (value) {
                    case 'booked':
                        if (appointment.status === 'booked' || appointment.status === 'deleted') {
                            const errorResponse = {
                                correlationId,
                                status: 'error',
                                message: `Appointment is already ${appointment.status}`,
                            };
                            return publishResponse(correlationId, errorResponse);
                        }
                        appointment.status = 'booked';
                        break;

                    case 'canceled':
                        if (appointment.status === 'canceled' || appointment.status === 'deleted') {
                            const errorResponse = {
                                correlationId,
                                status: 'error',
                                message: `Appointment is already ${appointment.status}`,
                            };
                            return publishResponse(correlationId, errorResponse);
                        }
                        appointment.patientId = null;
                        appointment.status = 'canceled';
                        break;

                    case 'delete':
                        if (appointment.status === 'deleted') {
                            const errorResponse = {
                                correlationId,
                                status: 'error',
                                message: 'Appointment is already deleted',
                            };
                            return publishResponse(correlationId, errorResponse);
                        }
                        appointment.status = 'deleted';
                        break;

                    default: {
                        const errorResponse = {
                            correlationId,
                            status: 'error',
                            message: 'Invalid status provided',
                        };
                        return publishResponse(correlationId, errorResponse);
                    }
                }
            } else if (key in appointment) {
                // Dynamically update other fields
                appointment[key] = value;
            } else {
                const errorResponse = {
                    correlationId,
                    status: 'error',
                    message: `Invalid field: ${key}`,
                };
                return publishResponse(correlationId, errorResponse);
            }
        }

        await appointment.save();

        const successResponse = {
            correlationId,
            status: 'success',
            message: 'Appointment updated successfully',
            appointment,
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
    responseTopic = `response/appointment-management/updated/${correlationId}`
   
    mqttClient.publish(responseTopic, JSON.stringify(response), (err) => {
        if (err) {
            console.error(`Failed to publish to ${responseTopic}:`, err);
        } else {
            console.log(`Response sent to ${responseTopic}`);
        }
    });
};
