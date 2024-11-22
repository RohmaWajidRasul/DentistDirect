// patient controller: 
import Patient from '../models/patient.js';
import mqttClient from '../../shared/mqtt-client.js';

export const createPatient = async (req, res) => {
    try {
        const { firstName, lastName, email, phoneNumber, dateOfBirth } = req.body;

        if (!firstName || !lastName || !email || !phoneNumber || !dateOfBirth ) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const patient = new Patient( req.body );
        await patient.save();

        const patientTopic = 'patient/create'; 
        const patientPayload = JSON.stringify({
            firstName : patient.firstName, 
            lastname : patient.lastname, 
            email : patient.email, 
            phoneNumber : patient.phoneNumber, 
            dateOfBirth: patient.dateOfBirth,
        });


        mqttClient.publish(patientTopic, patientPayload,(error) => {
            if(error){
                console.error(`Failed to publist to MQTT topic ${patientTopic}:`, error)

            } else {
                console.log(`Published new patient to MQTT topic: ${patientTopic}`);
            }
        });

        res.status(201).json({ message: 'Patient created successfully', patient });
    } catch (error) {
        res.status(500).json({ message: 'Error creating patient', error: error.message});
    }
    
};
