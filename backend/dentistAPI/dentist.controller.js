import Dentist from '../services/models/dentist.js';

export const createDentist = async (req, res) => {
    try {
        const { firstName, lastName, email, phoneNumber, specialization, location } = req.body;

        if (!firstName || !lastName || !email || !phoneNumber || !specialization || !location) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const dentist = new Dentist( req.body );
        await dentist.save();


        res.status(201).json({ message: 'Dentist created successfully', dentist });
    } catch (error) {
        res.status(500).json({ message: 'Error creating dentist', error });
    }
    
};