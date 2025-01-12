import Dentist from '../models/dentist.js';
import mqttClient from '../../../shared/mqtt-client.js';

let requestTime;
let requestTopic;

export const fetchDentistInfo = async (topic, message) => {

  console.log(`Handling message on topic: ${topic}`);

  let correlationId;

  try {
    let parsedMessage;
    requestTime = Date.now();
    requestTopic = topic;
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

    const { dentistIds } = parsedMessage.payload;
    console.log(dentistIds);

    let dentists;
    if (dentistIds && dentistIds.length > 0) {
    // Fetch dentists by IDs if IDs is provided
      dentists = await Dentist.find({ _id: { $in: dentistIds } }).select('firstName lastName specialization clinicId');
    } else {
    // Get all dentists if no IDs are provided
      dentists = await Dentist.find().select('firstName lastName specialization clinicId');
    }

    if (!dentists || dentists.length === 0) {
      const errorResponse = {
        correlationId,
        status: 'error',
        message: 'No dentists found for the provided IDs',
      };
      return publishResponse(correlationId, errorResponse);
    }

    const successResponse = {
      correlationId,
      status: 'success',
      message: 'Dentist info retrieved successfully',
      dentists,
    };
    return publishResponse(correlationId, successResponse);
  } catch (error) {
    console.error(`Error fetching dentist info: ${error.message}`);
    const errorResponse = {
      correlationId,
      status: 'error',
      message: 'Error fetching dentist info',
      error: error.message,
    };
    return publishResponse(correlationId, errorResponse);
  }
};

const publishResponse = (correlationId, response) => {
  const responseTopic = `response/dentist-info/${correlationId}`;
  console.log(response)
  mqttClient.publish(responseTopic, JSON.stringify(response), (err) => {
    if (err) {
      console.error(`Failed to publish to ${responseTopic}:`, err);
    } else {
      console.log(`Response sent to ${responseTopic}`);
    }
  });
  log(response.status);
};

const log = (result) => {
  try {
      const logTopic = "request/create-log"
      const topicParts = requestTopic.split("/");
      const serviceName = topicParts[1];
      const serviceId = topicParts[2];

      const payload =  {
          result,
          serviceId,
          serviceName,
          requestTime,
      }
        const correlationId = Date.now();
        const logMessage = {
        correlationId,
        payload
      };
    

      mqttClient.publish(logTopic, JSON.stringify(logMessage), (err) => {
          if (err) {
              console.error(`Failed to publish to ${logTopic}:`, err);
          } else {
              console.log(`Request sent to ${logTopic}`);
          }
      });
  } catch(error) {
      console.log(error)
  }
}
