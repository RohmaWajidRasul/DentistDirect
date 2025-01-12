import Clinic from '../models/clinic.js';
import mqttClient from '../../../shared/mqtt-client.js';

let requestTime;
let requestTopic;


export const fetchClinicInfo = async (topic, message) => {

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

    const { clinicIds } = parsedMessage.payload;
    //console.log(`Clinic IDs received: ${clinicIds}`);

    let clinics;
    if (clinicIds && clinicIds.length > 0) {
      clinics = await Clinic.find({ _id: { $in: clinicIds } }).select('name location longitude latitude');
    } else {
      clinics = await Clinic.find().select('name location longitude latitude');
    }

    if (!clinics || clinics.length === 0) {
      const errorResponse = {
        correlationId,
        status: 'error',
        message: 'No clinics found for the provided IDs',
      };
      return publishResponse(correlationId, errorResponse);
    }

    const successResponse = {
      correlationId,
      status: 'success',
      message: 'Clinic info retrieved successfully',
      clinics,
    };
    return publishResponse(correlationId, successResponse);
  } catch (error) {
    console.error(`Error fetching clinic info: ${error.message}`);
    const errorResponse = {
      correlationId,
      status: 'error',
      message: 'Error fetching clinic info',
      error: error.message,
    };
    return publishResponse(correlationId, errorResponse);
  }
};

const publishResponse = (correlationId, response) => {
  const responseTopic = `response/clinic-info/${correlationId}`;
  console.log(`Publishing response to topic: ${responseTopic}`);
  //console.log(response);
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
