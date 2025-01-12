import Log from '../models/logs.js';

export const createLog = async (topic, message) => {

    let correlationId;
    let payload;

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
        payload = parsedMessage.payload;

        const { result = null, serviceId = null, serviceName = null, requestTime = null, patientId = null } = payload;



        let newLog = new Log({
            result,
            serviceId,
            serviceName,
            requestTime,
            patientId
        });
        await newLog.save();

        


    } catch (error) {
        const errorResponse = {
            correlationId,
            status: 'error',
            message: 'Error creating log',
            error: error.message,
        };
        console.log(errorResponse)
    }

};
