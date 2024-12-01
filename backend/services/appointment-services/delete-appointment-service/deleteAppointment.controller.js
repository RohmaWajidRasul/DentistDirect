import Appointment from '../models/appointment.js';
import mqttClient from '../../../shared/mqtt-client.js';

export const deleteAppointment = async (topic, message) => {
    console.log(`Request received on topic: ${topic}`);

    if (topic !== 'request/appointments/delete') {
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
                message: 'Appointment ID is required'
            };
            return publishResponse(correlationId, errorResponse);
        }

        const appointment = await Appointment.findById(appointmentId);

        if (!appointment) {
            const errorResponse = {
                correlationId,
                status: 'error',
                message: 'Appointment not found'
            };
            return publishResponse(correlationId, errorResponse);
        }

        if (appointment.status === 'deleted') {
            const errorResponse = {
                correlationId,
                status: 'error',
                message: 'Appointment is already deleted'
            };
            return publishResponse(correlationId, errorResponse);
        }

        appointment.status = 'deleted';
        await appointment.save();

        const successResponse = {
            correlationId,
            status: 'success',
            message: 'Appointment successfully deleted',
            appointment
        };
        return publishResponse(correlationId, successResponse);

    } catch (error) {
        if (!correlationId) {
            console.error('Error. Correlation ID is missing or is undefined.', error.message);
            return;
        }

        const errorResponse = {
            correlationId,
            status: 'error',
            message: 'Error deleting appointment',
            error: error.message
        };
        return publishResponse(correlationId, errorResponse);
    }
};

const publishResponse = (correlationId, response) => {
    const responseTopic = `response/appointments/deleted/${correlationId}`;
    mqttClient.publish(responseTopic, JSON.stringify(response), (err) => {
        if (err) {
            console.error(`Failed to publish to ${responseTopic}:`, err);
        } else {
            console.log(`Response sent to ${responseTopic}:`);
        }
    });

}
