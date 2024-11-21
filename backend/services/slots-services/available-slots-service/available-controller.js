import Slot from '../slot.js';
import mqttClient from '../../../shared/mqtt-client.js';

export const handleAvailabilityRequest = async (topic, message) => {
    console.log(`Request received on topic: ${topic}`);

    if (topic !== 'request/availability/fetch') {
        return;
    }

    let correlationId;

    try {
        const parsedMessage = JSON.parse(message.toString());
        correlationId = parsedMessage.correlationId;

        if (!correlationId) {
            throw new Error('Correlation ID is missing in the request');
        }

        const { dentistId, date } = parsedMessage.payload;

        if (!dentistId) {
            const errorResponse = {
                correlationId,
                status: 'error',
                message: 'Dentist ID is required',
            };
            return publishAvailabilityResponse(correlationId, errorResponse);
        }

        // Build the query object
        const query = { dentistId };
        if (date) {
            query.date = date; // Filter by date if provided
        }

        // Fetch slots from the database
        const slots = await Slot.find(query).sort({ date: 1, startTime: 1 });

        if (!slots.length) {
            // Publish event for no slots found
            const noSlotsResponse = {
                correlationId,
                status: 'error',
                message: 'No slots found for the given dentist',
            };
            return publishAvailabilityResponse(correlationId, noSlotsResponse);
        }

        // Successful fetch
        const successResponse = {
            correlationId,
            status: 'success',
            message: 'Slots retrieved successfully',
            slots,
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
            message: 'Error retrieving slots',
            error: error.message,
        };
        return publishAvailabilityResponse(correlationId, errorResponse);
    }
};

const publishAvailabilityResponse = (correlationId, response) => {
    const responseTopic = `response/availability/fetched/${correlationId}`;
    mqttClient.publish(responseTopic, JSON.stringify(response), (err) => {
        if (err) {
            console.error(`Failed to publish to ${responseTopic}:`, err);
        } else {
            console.log(`Response sent to ${responseTopic}`);
        }
    });
};
