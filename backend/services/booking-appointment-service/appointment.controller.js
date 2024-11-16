import Appointment from '../../models/appointment.js';
import mqttClient from '../../shared/mqtt-client.js';

export const createAppointment = async (req, res) => {
    try {
        const { patientId, dentistId, slotId } = req.body;

        if (!patientId || !dentistId || !slotId) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const appointment = new Appointment( req.body );
        await appointment.save();

        mqttClient.publish('appointment/create', JSON.stringify(appointment));

        res.status(201).json({ message: 'Appointment created successfully', appointment });
    } catch (error) {
        res.status(500).json({ message: 'Error creating appointment', error });
    }
    
};