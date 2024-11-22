import mqttClient from '../../shared/mqtt-client.js';
import Appointment from '../models/appointment.js';

export const cancelAppointment = async (topic, message) => {
    console.log(`Request received on topic: ${topic}`);

    if (topic !== 'request/appointments/cancel') {
        return;
    }

    let correlationId;

    try {
        const parsedMessage = JSON.parse(message.toString());
        correlationId = parsedMessage.correlationId;

        if (!correlationId) {
            throw new Error('Correlation ID is missing in the request');
        }

        const { appointmentId } = parsedMessage.payload;

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

       
        if (appointment.status === 'canceled') {
            const errorResponse = {
                correlationId,
                status: 'not_found',
                message: 'Appointment is already canceled',
            };
            return publishResponse(correlationId, errorResponse);
        }
        
        appointment.status = 'canceled';
        await appointment.save();

        // Prepare success response
        const successResponse = {
            correlationId,
            status: 'success',
            message: 'Appointment canceled successfully',
            appointment,
        };

        return publishResponse(correlationId, successResponse);

    } catch (error) {
        if (!correlationId) {
            console.error('Error: Correlation ID is missing or undefined.', error.message);
            return;
        }

        const errorResponse = {
            correlationId,
            status: 'error',
            message: 'Error canceling appointment',
            error: error.message,
        };
        return publishResponse(correlationId, errorResponse);
    }
};

const publishResponse = (correlationId, response) => {
    const responseTopic = `response/appointments/canceled/${correlationId}`;
    mqttClient.publish(responseTopic, JSON.stringify(response), (err) => {
        if (err) {
            console.error(`Failed to publish to ${responseTopic}:`, err);
        } else {
            console.log(`Response sent to ${responseTopic}`);
        }
    });
};
