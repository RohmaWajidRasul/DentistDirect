import Appointment from '../models/appointment.js';
import mqttClient from '../../../shared/mqtt-client.js';

export const getAvailableAppointments = async (topic, message) => {
    console.log(`Request received on topic: ${topic}`);
    console.log("Raw message:", message.toString());

    if (topic !== 'request/appointments/availability/fetch') {
        return;
    }

    let correlationId;

    try {
        const parsedMessage = JSON.parse(message.toString());
        correlationId = parsedMessage.correlationId;

        // Validate that payload exists and is an object
        if (!("payload" in parsedMessage)) {
            console.error("Payload is missing in the request.");
            return publishAvailabilityResponse(correlationId, {
                correlationId,
                status: "error",
                message: "Payload is missing or undefined.",
            });
        }

        const { payload } = parsedMessage;

        // Safely destructure payload
        const { dentistId = null, date = null, location = null } = payload || {};

        console.log("Parsed message:", parsedMessage);
        console.log("Payload:", { dentistId, date, location });

        const query = { status: { $in: ['available', 'canceled'] } };
        if (dentistId) query.dentistId = dentistId;

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
        console.error("Error processing request:", error.message);
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