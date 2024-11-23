import Appointment from '../models/appointment.js';
import mqttClient from '../../shared/mqtt-client.js';

export const handleAppointmentRequest = async (topic, message) => {
    console.log(`Request received on topic: ${topic}`);

    if (topic !== 'request/appointments/create') {
        return;
    }

    let correlationId;

    try {

        const parsedMessage = JSON.parse(message.toString());
        correlationId = parsedMessage.correlationId;

        if (!correlationId) {
            throw new Error('Correlation ID is missing in the request'); 
        }

        const { patientId, dentistId, slotId } = parsedMessage.payload;


        if (!patientId || !dentistId || !slotId) {
            const errorResponse = {
                correlationId,
                status: 'error',
                message: 'All fields are required',
            };
            return publishResponse(correlationId, errorResponse);
        }


        const appointment = new Appointment({ patientId, dentistId, slotId });
        await appointment.save();

        const successResponse = {
            correlationId,
            status: 'success',
            message: 'Appointment created successfully',
            appointment,
        };
        notifySlot(slotId)
        return publishResponse(correlationId, successResponse);
    } catch (error) {
        if (!correlationId) {
            console.error('Critical error: Correlation ID is missing or undefined.', error.message);
            return;
        }

        const errorResponse = {
            correlationId,
            status: 'error',
            message: 'Error creating slot',
            error: error.message,
        };
        return publishResponse(correlationId, errorResponse);
    }
};

const publishResponse = (correlationId, response) => {
    const responseTopic = `response/appointments/created/${correlationId}`;
    mqttClient.publish(responseTopic, JSON.stringify(response), (err) => {
        if (err) {
            console.error(`Failed to publish to ${responseTopic}:`, err);
        } else {
            console.log(`Response sent to ${responseTopic}`);
        }
    });
};

const notifySlot = (slotId) => {
    const AlertBookedSlotServiceTopic = "request/slots/book"
    const correlationId = Date.now().toString();
    mqttClient.publish(AlertBookedSlotServiceTopic, JSON.stringify({ correlationId, slotId }), (err) => {
        if (err) {
            console.error(`Failed to publish to ${AlertBookedSlotServiceTopic}:`, err);
        } else {
            console.log(`Response sent to ${AlertBookedSlotServiceTopic}`);
        }
    
    });
}