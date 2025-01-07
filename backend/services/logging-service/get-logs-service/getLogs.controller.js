import Log from '../models/logs.js';
import mqttClient from '../../../shared/mqtt-client.js';


export const getLogs = async (topic, message) => {

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
            return publishResponse(correlationId, errorResponse);
        }
        correlationId = parsedMessage.correlationId;

        if (!correlationId) {
            throw new Error('Correlation ID is missing in the request');
        }

        var date = new Date();
        date.setMinutes(date.getMinutes() - 5);
        const logs = await Log.find({ createdAt: { $gte: date } })

        if (!logs) {
            const errorResponse = {
                correlationId,
                status: 'error',
                message: 'There are no Logs.',
            };

            return publishResponse(correlationId, errorResponse);
        }



        const successResponse = {
            correlationId,
            status: 'success',
            message: 'Logs Fetched successfully',
            logs,
        };
        return publishResponse(correlationId, successResponse);

    } catch (error) {
        if (!correlationId) {
            console.error('Error: Correlation ID is missing', error.message);
            return;
        }

        const errorResponse = {
            correlationId,
            status: 'error',
            message: 'Error registering dentist',
            error: error.message,
        };
        return publishResponse(correlationId, errorResponse);
    }

};

const publishResponse = (correlationId, response) => {
    const responseTopic = `response/get-logs/${correlationId}`;
    mqttClient.publish(responseTopic, JSON.stringify(response), (err) => {
        if (err) {
            console.error(`Failed to publish to ${responseTopic}:`, err);
        } else {
            console.log(`Response sent to ${responseTopic}`);
        }
    });
};