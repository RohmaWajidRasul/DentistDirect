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
        const users = await Log.find({ createdAt: { $gte: date } })

        if (!users) {
            const errorResponse = {
                correlationId,
                status: 'error',
                message: 'There are no users use.',
            };

            return publishResponse(correlationId, errorResponse);
        }

        const uniqueUsers = new Set(users.map(user => user.patientId));

        const numberUniqueUsers = uniqueUsers.size;




        const successResponse = {
            correlationId,
            status: 'success',
            message: 'Numbers of users fetched successfully',
            numberUniqueUsers,
        };
        return publishResponse(correlationId, successResponse);

    } catch (error) {
        if (!correlationId) {
            console.error('Error: Correlation ID is missing', error.message);
            return;
        }

        console.log(error)

        const errorResponse = {
            correlationId,
            status: 'error',
            message: 'Error fetching user numbers',
            error: error.message,
        };
        return publishResponse(correlationId, errorResponse);
    }

};

const publishResponse = (correlationId, response) => {
    const responseTopic = `response/get-usernumbers/${correlationId}`;
    mqttClient.publish(responseTopic, JSON.stringify(response), (err) => {
        if (err) {
            console.error(`Failed to publish to ${responseTopic}:`, err);
        } else {
            console.log(`Response sent to ${responseTopic}`);
        }
    });
};