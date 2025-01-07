import Notification from '../models/notification.js';
import Patient from '../models/patient.js';
import mqttClient from '../../../shared/mqtt-client.js';

export const createMessage = async (message) => {

    let correlationId; 
    let patientId;

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
            console.log(errorResponse)
        }

        correlationId = parsedMessage.correlationId;

        if (!correlationId) {
            throw new Error('Correlation ID is missing in the request');
        }

        let { patientId, notification } = parsedMessage.payload;
        //console.log(parsedMessage)

        if (!patientId || !notification) {
            const errorResponse ={
                correlationId, 
                status: 'error', 
                message : 'All fields are required', 
            }; 
            console.log(errorResponse)
            return publishResponse(correlationId, patientId, errorResponse);

        }


        const patient = await Patient.findById(patientId);
        console.log(patient)
        if ( !patient ) {
            const errorResponse ={
                correlationId, 
                status: 'error', 
                message : 'Patient not found.', 
            }; 

            console.log(errorResponse)
            return publishResponse(correlationId, patientId, errorResponse);

        }
        
        const body = notification.body;
        const subject = notification.subject;

        let newNotification = new Notification({ 
            "body": body,
            "subject": subject
         });
        newNotification = await newNotification.save();
        patient.notifications.push(newNotification._id);
        await patient.save();

        const successResponse = {
            correlationId, 
            status: 'success', 
            message: 'Notification create successfully', 
            newNotification: newNotification,
        }; 
        return publishResponse(correlationId, patientId, successResponse);

    } catch (error) {
        const errorResponse ={
            correlationId, 
            status : 'error', 
            message: 'Error creating notification', 
            error: error.message, 
        };
        return publishResponse(correlationId, patientId, errorResponse);
    }
    
};

const publishResponse = (correlationId, patientId, response) => {
    let responseTopic;
    responseTopic = `response/create-notifcation/${patientId}/${correlationId}`
   
    mqttClient.publish(responseTopic, JSON.stringify(response), (err) => {
        if (err) {
            console.error(`Failed to publish to ${responseTopic}:`, err);
        } else {
            console.log(`Response sent to ${responseTopic}`);
        }
    });
};
