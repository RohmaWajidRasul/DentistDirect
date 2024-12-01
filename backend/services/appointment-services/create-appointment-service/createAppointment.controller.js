import Appointment from '../models/appointment.js';
import mqttClient from '../../../shared/mqtt-client.js';

export const createAppointment = async (topic, message) => {
    console.log(`Request received on topic: ${topic}`);

    if (topic !== 'request/appointments/create') {
        return;
    }

    let correlationId;

    try {

        const parsedMessage = JSON.parse(message.toString());
        correlationId = parsedMessage.correlationId;

        if (!correlationId) {
            throw new Error('Correlation ID is missing in the request'); 
        }

        const { dentistId, date, startTime, endTime } = parsedMessage.payload;


        if (!dentistId || !date || !startTime || !endTime) {
            const errorResponse = {
                correlationId,
                status: 'error',
                message: 'All fields are required',
            };
            return publishResponse(correlationId, errorResponse);
        }

        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);
        const duration = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);

        if (duration <= 0) {
            const errorResponse = {
                correlationId,
                status: 'error',
                message: 'End time must be after start time',
            };
            return publishResponse(correlationId, errorResponse);
        }

        const appointment = new Appointment({ dentistId, date, startTime, endTime, duration });
        await appointment.save();

        const successResponse = {
            correlationId,
            status: 'success',
            message: 'Appointment created successfully',
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
            message: 'Error creating appointment',
            error: error.message,
        };
        return publishResponse(correlationId, errorResponse);
    }
};

const publishResponse = (correlationId, response) => {
    const responseTopic = `response/appointments/created/${correlationId}`;
    mqttClient.publish(responseTopic, JSON.stringify(response), (err) => {
        if (err) {
            console.error(`Failed to publish to ${responseTopic}:`, err);
        } else {
            console.log(`Response sent to ${responseTopic}`);
        }
    });
};
