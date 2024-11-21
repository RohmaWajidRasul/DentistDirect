import Slot from '../model/slot.js';
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

        // Fetch slots with a timeout wrapper
        const slots = await withTimeout(Slot.find(query).sort({ date: 1, startTime: 1 }), 5000);

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

        // Handle timeout-specific errors
        const errorMessage =
            error.name === 'TimeoutError'
                ? 'The request timed out while retrieving slots'
                : 'Error retrieving slots';

        const errorResponse = {
            correlationId,
            status: 'error',
            message: errorMessage,
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

// Timeout Wrapper Function
const withTimeout = (promise, ms) => {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
            const error = new Error('Operation timed out');
            error.name = 'TimeoutError';
            reject(error);
        }, ms);
    });

    return Promise.race([
        promise.finally(() => clearTimeout(timeoutId)), // Clears the timeout if the promise resolves
        timeoutPromise,
    ]);
};
