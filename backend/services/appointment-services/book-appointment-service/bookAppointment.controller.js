import Appointment from '../models/appointment.js';
import mqttClient from '../../../shared/mqtt-client.js';

export const bookAppointment = async (topic, message) => {
    console.log(`Request received on topic: ${topic}`);

    if (topic !== 'request/appointments/book') {
        return;
    }

    let correlationId;

    try {
        let parsedMessage;
        try {
            parsedMessage = JSON.parse(message.toString());
        } catch (err) {
            console.error('Invalid JSON payload:', err.message);
            return;
        }

        correlationId = parsedMessage.correlationId;

        if (!correlationId) {
            throw new Error('Correlation ID is missing in the request'); 
        }

        const { appointmentId, patientId} = parsedMessage.payload;


        if (!patientId || !appointmentId ) {
            const errorResponse = {
                correlationId,
                status: 'error',
                message: 'All fields are required',
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

        if (appointment.status === 'booked' || appointment.status === 'deleted') {
            const errorResponse = {
                correlationId,
                status: 'error',
                message: `Appointment is ${appointment.status}`
            };
            return publishResponse(correlationId, errorResponse);
        }

        appointment.patientId = patientId;
        appointment.status = 'booked';

        await appointment.save();

        const successResponse = {
            correlationId,
            status: 'success',
            message: 'Appointment booked successfully',
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
            message: 'Booking Appointment',
            error: error.message,
        };
        return publishResponse(correlationId, errorResponse);
    }
};

const publishResponse = (correlationId, response) => {
    const responseTopic = `response/appointments/booked/${correlationId}`;
    mqttClient.publish(responseTopic, JSON.stringify(response), (err) => {
        if (err) {
            console.error(`Failed to publish to ${responseTopic}:`, err);
        } else {
            console.log(`Response sent to ${responseTopic}`);
        }
    });
};
