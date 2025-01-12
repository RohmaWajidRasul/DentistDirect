import Appointment from '../models/appointment.js';
import mqttClient from '../../../shared/mqtt-client.js';

let patientId;
let requestTime;
let requestTopic;

export const createAppointment = async (topic, message) => {
    console.log(`Request received on topic: ${topic}`);

    let correlationId;

    try {
        requestTime = Date.now();
        requestTopic = topic;
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

        const { dentistId, date, startTime, endTime, clinicId } = parsedMessage.payload;


        if (!dentistId || !date || !startTime || !endTime || !clinicId) {
            const errorResponse = {
                correlationId,
                status: 'error',
                message: 'All fields are required',
            };
            return publishResponse(correlationId, errorResponse);
        }
        patientId = dentistId;

        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);
        const duration = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);

        const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5]?[0-9])$/; // To make sure it is in the correct time format 
        if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
            const errorResponse = {
                correlationId,
                status: 'error',
                message: 'Invalid time format. Must be HH:MM.',
            };
            return publishResponse(correlationId, errorResponse);
        }

        if (duration <= 0) {
            const errorResponse = {
                correlationId,
                status: 'error',
                message: 'End time must be after start time',
            };
            return publishResponse(correlationId, errorResponse);
        }

        const appointment = new Appointment({ dentistId, date, startTime, endTime, duration, clinicId});
        await appointment.save();

        const successResponse = {
            correlationId,
            status: 'success',
            message: 'Appointment created successfully',
            appointment,
        };

        matchPreference(appointment);
        return publishResponse(correlationId, successResponse);
    } catch (error) {
        if (!correlationId) {
            console.error('Critical error: Correlation ID is missing or undefined.', error.message);
            return;
        }

        const errorResponse = {
            correlationId,
            status: 'error',
            message: 'Error creating appointment',
            error: error.message,
        };
        return publishResponse(correlationId, errorResponse);
    }
};

const publishResponse = (correlationId, response) => {
    const responseTopic = `response/create-appointment/${correlationId}`;
    mqttClient.publish(responseTopic, JSON.stringify(response), (err) => {
        if (err) {
            console.error(`Failed to publish to ${responseTopic}:`, err);
        } else {
            console.log(`Response sent to ${responseTopic}`);
        }
    });
    log(response.status)
};

const matchPreference = (appointment) => {
    //const correlationId = Date.now().toString();
    const requestTopic = `request/monitor-preference`;
    mqttClient.publish(requestTopic, JSON.stringify(appointment), (err) => {
        if (err) {
            console.error(`Failed to publish to ${requestTopic}:`, err);
        } else {
            console.log(`Response sent to ${requestTopic}`);
        }
    });
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
            patientId

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