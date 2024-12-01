import Appointment from '../models/appointment.js';
import mqttClient from '../../../shared/mqtt-client.js';

export const getAvailableAppointments = async (topic, message) => {
    console.log(`Request received on topic: ${topic}`);

    if (topic !== 'request/appointments/availability/fetch') {
        return;
    }

    let correlationId;

    try {
        const parsedMessage = JSON.parse(message.toString());
        correlationId = parsedMessage.correlationId;

        if (!correlationId) {
            throw new Error('Correlation ID is missing in the request');
        }

        const { dentistId, date, location } = parsedMessage.payload;

        if (!dentistId) {
            const errorResponse = {
                correlationId,
                status: 'error',
                message: 'Dentist ID is required',
            };
            return publishAvailabilityResponse(correlationId, errorResponse);
        }

        const query = { dentistId, status: { $in: ['available', 'canceled'] } };

        if (date) {
            query.date = date; // Filter by date if provided
        }

        if (location) {
            query.location = location; // Filter by location if provided
        }

        const appointments = await Appointment.find(query)
            .populate('dentistId', 'firstName lastName location')
            .sort({ date: 1, startTime: 1 });

        if (!appointments.length) {
            const noAppointmentsResponse = {
                correlationId,
                status: 'error',
                message: 'No appointments found for the given dentist',
            };
            return publishAvailabilityResponse(correlationId, noAppointmentsResponse);
        }

        const successResponse = {
            correlationId,
            status: 'success',
            message: 'Appointments retrieved successfully',
            appointments,
        };
        return publishAvailabilityResponse(correlationId, successResponse);
    } catch (error) {
        if (!correlationId) {
            console.error('Critical error: Correlation ID is missing or undefined.', error.message);
            return;
        }

        const errorResponse = {
            correlationId,
            status: 'error',
            message: 'Error fetching appointments',
            error: error.message,
        };
        return publishAvailabilityResponse(correlationId, errorResponse);
    }
};

const publishAvailabilityResponse = (correlationId, response) => {
    const responseTopic = `response/appointments/availability/fetched/${correlationId}`;
    mqttClient.publish(responseTopic, JSON.stringify(response), (err) => {
        if (err) {
            console.error(`Failed to publish to ${responseTopic}:`, err);
        } else {
            console.log(`Response sent to ${responseTopic}`);
        }
    });
};