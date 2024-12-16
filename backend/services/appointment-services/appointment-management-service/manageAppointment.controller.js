import Appointment from '../models/appointment.js';
import mqttClient from '../../../shared/mqtt-client.js';

export const manageAppointment = async (topic, message) => {
    console.log(`Request received on topic: ${topic}`);

    const topicParts = topic.split('/');
    const action = topicParts[3]; 

    if (!['book', 'cancel', 'delete'].includes(action)) {
        console.error(`Invalid action in topic: ${topic}`);
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
            return publishResponse(action, correlationId, errorResponse);
        }

        correlationId = parsedMessage.correlationId;

        if (!correlationId) {
            throw new Error('Correlation ID is missing in the request');
        }

        const { appointmentId, patientId } = parsedMessage.payload;
        console.log(parsedMessage.payload)

        if (!appointmentId) {
            const errorResponse = {
                correlationId,
                status: 'error',
                message: 'Appointment ID is required',
            };
            return publishResponse(action, correlationId, errorResponse);
        }

        const appointment = await Appointment.findById(appointmentId);

        if (!appointment) {
            const errorResponse = {
                correlationId,
                status: 'error',
                message: 'Appointment not found',
            };
            return publishResponse(action, correlationId, errorResponse);
        }

        switch (action) {
            case 'book':
                if (appointment.status === 'booked' || appointment.status === 'deleted') {
                    const errorResponse = {
                        correlationId,
                        status: 'error',
                        message: `Appointment is already ${appointment.status}`,
                    };
                    return publishResponse(action, correlationId, errorResponse);
                }

                appointment.patientId = patientId;
                appointment.status = 'booked';
                break;

            case 'cancel':
                if (appointment.status === 'canceled' || appointment.status === 'deleted') {
                    const errorResponse = {
                        correlationId,
                        status: 'error',
                        message: `Appointment is already ${appointment.status}`,
                    };
                    return publishResponse(action, correlationId, errorResponse);
                }

                appointment.status = 'canceled';
                break;

            case 'delete':
                if (appointment.status === 'deleted') {
                    const errorResponse = {
                        correlationId,
                        status: 'error',
                        message: 'Appointment is already deleted',
                    };
                    return publishResponse(action, correlationId, errorResponse);
                }

                appointment.status = 'deleted';
                break;
        }

        await appointment.save();

        const successResponse = {
            correlationId,
            status: 'success',
            message: `Appointment ${action}ed successfully`,
            appointment,
        };
        return publishResponse(action, correlationId, successResponse);

    } catch (error) {
        if (!correlationId) {
            console.error('Critical error: Correlation ID is missing or undefined.', error.message);
            return;
        }

        const errorResponse = {
            correlationId,
            status: 'error',
            message: `Error processing ${action} request`,
            error: error.message,
        };
        return publishResponse(action, correlationId, errorResponse);
    }
};

const publishResponse = (action, correlationId, response) => {
    let responseTopic;

    if (action === 'delete') {
        responseTopic = `response/appointments/manage/deleted/${correlationId}`;
    } else {
        responseTopic = `response/appointments/manage/${action}ed/${correlationId}`
    }

    mqttClient.publish(responseTopic, JSON.stringify(response), (err) => {
        if (err) {
            console.error(`Failed to publish to ${responseTopic}:`, err);
        } else {
            console.log(`Response sent to ${responseTopic}`);
        }
    });
};
