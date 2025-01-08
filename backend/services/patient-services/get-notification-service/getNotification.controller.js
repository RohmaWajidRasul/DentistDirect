import mqttClient from '../../../shared/mqtt-client.js';
import Patient from '../models/patient.js';
import Notification from '../models/notification.js';
Notification;

export const getMessages = async (topic, message) => {

  console.log(`Handling message on topic: ${topic}`);

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

    const { patientId } = parsedMessage.payload;

    const patient = await Patient.findById(patientId);
    await patient.populate("notifications");

    if (!patient.notifications) {
      const errorResponse = {
        correlationId,
        status: 'error',
        message: 'No notifications found for the provided ID',
      };
      return publishResponse(correlationId, errorResponse);
    }

    const successResponse = {
      correlationId,
      status: 'success',
      message: 'Notifications retrieved successfully',
      notifications: patient.notifications.reverse(),
    };
    return publishResponse(correlationId, successResponse);
  } catch (error) {
    console.error(`Error fetching notifications: ${error.message}`);
    const errorResponse = {
      correlationId,
      status: 'error',
      message: 'Error fetching notifications',
      error: error.message,
    };
    return publishResponse(correlationId, errorResponse);
  }
};

const publishResponse = (correlationId, response) => {
  const responseTopic = `response/messages/fetched/${correlationId}`;
  //console.log(response)
  mqttClient.publish(responseTopic, JSON.stringify(response), (err) => {
    if (err) {
      console.error(`Failed to publish to ${responseTopic}:`, err);
    } else {
      console.log(`Response sent to ${responseTopic}`);
    }
  });
};
