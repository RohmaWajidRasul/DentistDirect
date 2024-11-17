import Patient from '../../models/patient.js';
import mqttClient from '../../shared/mqtt-client.js';

export const createPatient = async (req, res) => {
    try {
        const { firstName, lastName, email, phoneNumber, dateOfBirth } = req.body;

        if (!firstName || !lastName || !email || !phoneNumber || !dateOfBirth ) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const patient = new Patient( req.body );
        await patient.save();

        mqttClient.publish('patient/create', JSON.stringify(patient));

        res.status(201).json({ message: 'Patient created successfully', patient });
    } catch (error) {
        res.status(500).json({ message: 'Error creating patient', error });
    }
    
};