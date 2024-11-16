import Slot from '../../models/slot.js';
import mqttClient from '../../shared/mqtt-client.js';

export const createSlot = async (req, res) => {
    try {
        const { dentistId, date, startTime, endTime } = req.body;

        if (!dentistId || !date || !startTime || !endTime) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);
        const duration = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);

        if (duration <= 0) {
            return res.status(400).json({ message: 'End time must be after start time' });
        }

        const slot = new Slot({ dentistId, date, startTime, endTime, duration });
        await slot.save();

        mqttClient.publish('slots/created', JSON.stringify(slot));

        res.status(201).json({ message: 'Slot created successfully', slot });
    } catch (error) {
        res.status(500).json({ message: 'Error creating slot', error });
    }
    
};

