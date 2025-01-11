import mqttClient from '../../../shared/mqtt-client.js';
import Notification from '../models/notification.js';


export const changeMessage = async (topic, message) => {

  console.log(`Handling notification on topic: ${topic}`);

  let correlationId;

  try {
    let parsedMessage;
    try {
        parsedMessage = JSON.parse(message.toString());

    } catch (error) {
        console.log(error)
        const errorResponse = {
            correlationId,
            status: 'error',
            message: 'Invalid JSON format in request',
        };
        return publishResponse(correlationId, errorResponse);
    }
    correlationId = parsedMessage.correlationId;

    if (!correlationId) {
      throw new Error('Correlation ID is missing in the request');
    }

    const { notificationId, status} = parsedMessage.payload;

    const notification = await Notification.findById(notificationId);

    if (!notification) {
      const errorResponse = {
        correlationId,
        status: 'error',
        message: 'No notification found for the provided ID',
      };
      return publishResponse(correlationId, errorResponse);
    }

    notification.status = status;
    await notification.save();


    const successResponse = {
      correlationId,
      status: 'success',
      message: 'Notification managed successfully',
    };

    return publishResponse(correlationId, successResponse);
  } catch (error) {
    console.error(`Error managing notification: ${error.message}`);
    const errorResponse = {
      correlationId,
      status: 'error',
      message: 'Error managing notification',
      error: error.message,
    };
    return publishResponse(correlationId, errorResponse);
  }
};

const publishResponse = (correlationId, response) => {
  const responseTopic = `response/notification-management/${correlationId}`;
  console.log(response)
  mqttClient.publish(responseTopic, JSON.stringify(response), (err) => {
    if (err) {
      console.error(`Failed to publish to ${responseTopic}:`, err);
    } else {
      console.log(`Response sent to ${responseTopic}`);
    }
  });
};
