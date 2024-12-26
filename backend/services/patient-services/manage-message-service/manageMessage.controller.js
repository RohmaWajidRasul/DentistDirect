import mqttClient from '../../../shared/mqtt-client.js';
import Message from '../models/message.js';


export const changeMessage = async (topic, message) => {

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

    const { messageId } = parsedMessage.payload;

    const messageInstance = await Message.findById(messageId);

    if (!message) {
      const errorResponse = {
        correlationId,
        status: 'error',
        message: 'No messages found for the provided ID',
      };
      return publishResponse(correlationId, errorResponse);
    }

    messageInstance.status = "read";
    await messageInstance.save();


    const successResponse = {
      correlationId,
      status: 'success',
      message: 'Messages managed successfully',
    };

    return publishResponse(correlationId, successResponse);
  } catch (error) {
    console.error(`Error managing messages: ${error.message}`);
    const errorResponse = {
      correlationId,
      status: 'error',
      message: 'Error managing messages',
      error: error.message,
    };
    return publishResponse(correlationId, errorResponse);
  }
};

const publishResponse = (correlationId, response) => {
  const responseTopic = `response/messages/read/${correlationId}`;
  console.log(response)
  mqttClient.publish(responseTopic, JSON.stringify(response), (err) => {
    if (err) {
      console.error(`Failed to publish to ${responseTopic}:`, err);
    } else {
      console.log(`Response sent to ${responseTopic}`);
    }
  });
};
