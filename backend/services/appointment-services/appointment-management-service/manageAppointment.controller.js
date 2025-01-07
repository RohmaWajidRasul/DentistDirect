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
                        if (!updates.patientId) {
                            const errorResponse = {
                                correlationId,
                                status: 'error',
                                message: 'Patient ID is required to book the appointment',
                            };
                            return publishResponse(correlationId, errorResponse);
                        }
                    
                        appointment.status = 'booked';
                        appointment.patientId = updates.patientId;
                        console.log(appointment);
                        matchPreference(appointment);
                        break;

                    case 'canceled':
                        { 
                            if (!appointment.status === 'booked') {
                                const errorResponse = {
                                    correlationId,
                                    status: 'error',
                                    message: `Appointment is already ${appointment.status}`,
                                };
                                return publishResponse(correlationId, errorResponse);
                            }

                            notify(appointment, value);
                            
                            appointment.patientId = null;
                            appointment.status = 'canceled';                            
                            
                            break; 
                        }

                    case 'deleted':
                        if (appointment.status === 'deleted') {
                            const errorResponse = {
                                correlationId,
                                status: 'error',
                                message: 'Appointment is already deleted',
                            };
                            return publishResponse(correlationId, errorResponse);
                        } else if (appointment.status === 'booked') {
                            notify(appointment, value)

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

const notify = (appointment, status) => {
    const correlationId = Date.now().toString();
    const topic = `request/create-notification`;

    const notification = {
        body: `Your appointment on ${appointment.date} got ${status}. Please book another appointment to meet your dental needs.`,
        subject: `Appointment ${status}`,
    }

    const payload = {
        patientId: appointment.patientId,
        notification: notification
    }

    mqttClient.publish(topic, JSON.stringify({correlationId, payload}), (err) => {
        if (err) {
            console.error(`Failed to publish to ${topic}:`, err);
        } else {
            console.log(`Response sent to ${topic}`);
        }
    });
};

const matchPreference = (appointment) => {
    //const correlationId = Date.now().toString();
    const requestTopic = `request/monitor-preference`;
    mqttClient.publish(requestTopic, JSON.stringify(appointment), (err) => {
        if (err) {
            console.error(`Failed to publish to ${requestTopic}:`, err);
        } else {
            console.log(`Response sent to ${requestTopic}`);
        }
    });
};

