import Patient from '../models/patient.js';
import mqttClient from '../../../shared/mqtt-client.js';
import { v4 as uuidv4 } from 'uuid';


const fetchDentistSpecialization = async (dentistId) => {
    return new Promise((resolve, reject) => {
        const correlationId = uuidv4(); 
        const requestTopic = `request/dentist-info`;
        const responseTopic = `response/dentist-info/${correlationId}`;
        const dentistIds = [dentistId];
        const payload = { dentistIds };

        console.log(payload);

        const onResponse = (message) => {
            
            mqttClient.removeListener('message', onResponse);
            clearTimeout(timeout);

            try {
                const response = JSON.parse(message.toString());
                if (response.status === 'success' && response.dentists.length > 0) {
                    resolve(response.dentists[0].specialization);
                } else {
                    reject(new Error('Specialization not found or service error'));
                }
            } catch (error) {
                reject(error);
            }
            
        };

        mqttClient.subscribe(responseTopic, (err) => {
            if (err) {
                reject(new Error(`Failed to subscribe to ${responseTopic}: ${err.message}`));
                return;
            }

            mqttClient.on('message', (topic, message) => {
                if (topic === responseTopic) {
                    onResponse(message);
                }
            });
            
            mqttClient.publish(requestTopic, JSON.stringify({ correlationId, payload }), (err) => {
                if (err) {
                    mqttClient.removeListener('message', onResponse);
                    reject(new Error(`Failed to publish to ${requestTopic}: ${err.message}`));
                }
            });
        });

        const timeout = setTimeout(() => {
            mqttClient.removeListener('message', onResponse);
            mqttClient.unsubscribe(responseTopic);
            reject(new Error('Timeout while waiting for dentist-info response'));
        }, 20000); 
    });
};


export const matchPreference = async (topic, message) => {
    console.log(`Message received on topic: ${topic}`);
    try {
        const appointment = JSON.parse(message.toString());
        console.log (appointment);

        const { date, dentistId, clinicId, status } = appointment;

        const specialization = await fetchDentistSpecialization(dentistId);

        const query = {
            $and: [
                {
                    $or: [
                        { "preferences.dateRange.startDate": { $lte: new Date(date) } },
                        { "preferences.dateRange.endDate": { $gte: new Date(date) } },
                    ],
                },
                {
                    $or: [
                        { "preferences.dentist": dentistId },
                        { "preferences.specialization": specialization },
                        { "preferences.clinic": clinicId },
                    ],
                },
            ],
        };

        const matchedPatients = await Patient.find(query);

        if (matchedPatients.length > 0) {
            console.log(`Matched patients: ${matchedPatients.length}`);

            matchedPatients.forEach((patient) => {
                if (status === 'booked') {
                    sendConflictNotification(patient, appointment);
                } else {
                    sendMatchNotification(patient, appointment);
                }
            });
        } else {
            console.log('No matching patients found for this appointment.');
        }
    } catch (err) {
        console.error('Error processing matchPreference:', err.message);
    }
};

const sendMatchNotification = (patient, appointment) => {
    const topic = `request/create-notification`;

    const notificationPayload = {
        patientId: patient._id,
        notification: {
            subject: "Appointment Match Found",
            body: `An appointment matching your preferences has been found on ${new Date(
                appointment.date
            ).toLocaleDateString()}. Book now to secure your slot!`
        }
    };

    mqttClient.publish(topic, JSON.stringify(notificationPayload), (err) => {
        if (err) {
            console.error(`Failed to publish to ${topic}:`, err);
        } else {
            console.log(`Match notification sent to ${topic}`);
        }
    });
};

const sendConflictNotification = (patient, appointment) => {
    const topic = `request/create-notification`;

    const notificationPayload = {
        patientId: patient._id,
        notification: {
            subject: "Preferred Appointment Booked",
            body: `An appointment matching your preferences on ${new Date(
                appointment.date
            ).toLocaleDateString()} has been booked by someone else. Please consider adjusting your preferences or booking a different slot.`
        }
    };

    mqttClient.publish(topic, JSON.stringify(notificationPayload), (err) => {
        if (err) {
            console.error(`Failed to publish to ${topic}:`, err);
        } else {
            console.log(`Conflict notification sent to ${topic}`);
        }
    });
};
