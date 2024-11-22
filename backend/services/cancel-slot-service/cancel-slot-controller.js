import Slot from '../models/slot.js';
import mqttClient from '../../shared/mqtt-client.js';

export const handleCancelSlotRequests = async (topic, message) => {
    console.log(`Request received on topic: ${topic}`);

    if (topic !== 'request/slots/cancel') {
        return;
    }

    let correlationId;

    try {
        const parsedMessage = JSON.parse(message.toString());
        correlationId = parsedMessage.correlationId;

        if (!correlationId) {
            throw new Error('Correlation ID is missing in the request');
        }

        const { slotId } = parsedMessage.payload;

        if (!slotId) {
            const errorResponse = {
                correlationId,
                status: 'error',
                message: 'Slot ID is required'
            };
            return publishResponse(correlationId, errorResponse);
        }

        const slot = await Slot.findById(slotId);

        if (!slot) {
            const errorResponse = {
                correlationId,
                status: 'error',
                message: 'Slot not found'
            };
            return publishResponse(correlationId, errorResponse);
        }

        if (slot.status === 'cancelled' || slot.status === 'Cancelled') {
            const errorResponse = {
                correlationId,
                status: 'error',
                message: 'Slot is already cancelled'
            };
            return publishResponse(correlationId, errorResponse);
        }

        slot.status = 'cancelled';
        await slot.save();

        const successResponse = {
            correlationId,
            status: 'success',
            message: 'Slot successfully cancelled',
            slot
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
            message: 'Error cancelling slot',
            error: error.message
        };
        return publishResponse(correlationId, errorResponse);
    }
};

const publishResponse = (correlationId, response) => {
    const responseTopic = `response/slots/cancelled/${correlationId}`;
    mqttClient.publish(responseTopic, JSON.stringify(response), (err) => {
        if (err) {
            console.error(`Failed to publish to ${responseTopic}:`, err);
        } else {
            console.log(`Response sent to ${responseTopic}:`);
        }
    });

}
