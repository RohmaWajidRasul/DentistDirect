import Message from '../models/message.js';
import Patient from '../models/patient.js';
import mqttClient from '../../../shared/mqtt-client.js';

export const createMessage = async (topic, message) => {
    const messageTopic = 'request/messages/create'; 

    if (topic !== messageTopic){
        return; 
    }

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
            };
        }

        const { patientId, date } = parsedMessage;
        console.log(parsedMessage)

        if (!patientId || !date) {
            const errorResponse ={
                correlationId, 
                status: 'error', 
                message : 'All fields are required', 
            }; 
            console.log(errorResponse)
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
        }
        
        const body = `Your appointment on ${date} got cancelled`
        const header = "Appointment cancelled";

        let newMessage = new Message({ 
            "body": body,
            "subject": header
         });
        newMessage = await newMessage.save();
        patient.messages.push(newMessage._id);
        await patient.save();

        const successResponse = {
            correlationId, 
            status: 'success', 
            message: 'Dentist registered successfully', 
            newMessage,
        }; 
        console.log(successResponse)

    } catch (error) {
        const errorResponse ={
            correlationId, 
            status : 'error', 
            message: 'Error registering dentist', 
            error: error.message, 
        };
        console.log(errorResponse)
    }
    
};
