import Appointment from '../models/appointment.js';
import mqttClient from '../../../shared/mqtt-client.js';

export const getAvailableAppointments = async (topic, message) => {
    console.log(`Request received on topic: ${topic}`);
    console.log("Raw message:", message.toString());

    if (topic !== 'request/appointments/availability/fetch') {
        return;
    }

    let correlationId;

    try {
        const parsedMessage = JSON.parse(message.toString());
        correlationId = parsedMessage.correlationId;

        if (!parsedMessage.payload || typeof parsedMessage.payload !== 'object') {
            const errorResponse = {
                correlationId,
                status: 'error',
                message: 'Invalid or missing payload.',
            };
            return publishAvailabilityResponse(correlationId, errorResponse);
        }

        const { payload } = parsedMessage;
        const { dentistId = null, date = null, location = null } = payload;

        const query = { status: { $in: ['available', 'canceled'] } };
        if (dentistId) query.dentistId = dentistId;
        if (date) query.date = date;
        if (location) query.location = location;
        const appointments = await Appointment.find(query)
            .sort({ date: 1, startTime: 1 });

        if (!appointments.length) {
            const noAppointmentsResponse = {
                correlationId,
                status: 'error',
                message: 'No appointments found.',
            };
            return publishAvailabilityResponse(correlationId, noAppointmentsResponse);
        }

        const dentistIds = [...new Set(appointments.map(app => app.dentistId.toString()))];

        const dentistDetails = await fetchDentistsInfo(dentistIds);

        const dentistMap = Object.fromEntries(dentistDetails.map(dentist => [dentist._id, dentist]));

        const appointmentsWithDentists = appointments.map(app => ({
            ...app.toObject(),
            dentist: dentistMap[app.dentistId.toString()] || null,
        }));

        const successResponse = {
            correlationId,
            status: 'success',
            message: 'Appointments and dentist info retrieved successfully',
            appointments: appointmentsWithDentists,
        };

        return publishAvailabilityResponse(correlationId, successResponse);
    } catch (error) {
        console.error("Error processing request:", error.message);
        const errorResponse = {
            correlationId,
            status: 'error',
            message: 'Error fetching appointments',
            error: error.message,
        };
        return publishAvailabilityResponse(correlationId, errorResponse);
    }
};

const fetchDentistsInfo = (dentistIds) => {
    return new Promise((resolve, reject) => {
        const correlationId = generateCorrelationId();
        const payload = { dentistIds };
        const requestTopic = 'request/dentists/info';

        const responseTopic = `response/dentists/info/${correlationId}`;
        const timeout = setTimeout(() => {
            mqttClient.unsubscribe(responseTopic); 
            reject(new Error('Timeout waiting for dentist info response'));
        }, 20000);

        const handleResponse = (topic, message) => {
            console.log(`Received message on topic: ${topic}`); 
            if (topic === responseTopic) {
                clearTimeout(timeout);
                mqttClient.unsubscribe(responseTopic); 
        
                try {
                    const parsedMessage = JSON.parse(message.toString());
                    if (parsedMessage.status === 'success') {
                        resolve(parsedMessage.dentists);
                    } else {
                        reject(new Error(parsedMessage.message));
                    }
                } catch (err) {
                    console.error('Error parsing response:', err);
                    reject(err);
                }
            }
        };

        mqttClient.subscribe(responseTopic, (err) => {

            if (err) {
                console.error('Failed to subscribe to response topic:', err);
                clearTimeout(timeout);
                reject(err);
            }
        });
        
        mqttClient.on('message', handleResponse);

        mqttClient.publish(requestTopic, JSON.stringify({ correlationId, payload }), (err) => {
            if (err) {
                clearTimeout(timeout);
                mqttClient.off('message', handleResponse);
                reject(err);
            }
        });
    });
};

const generateCorrelationId = () => `corr-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

const publishAvailabilityResponse = (correlationId, response) => {
    const responseTopic = `response/appointments/availability/fetched/${correlationId}`;
    mqttClient.publish(responseTopic, JSON.stringify(response), (err) => {
        if (err) {
            console.error(`Failed to publish to ${responseTopic}:`, err);
        } else {
            console.log(`Response sent to ${responseTopic}`);
        }
    });
};
