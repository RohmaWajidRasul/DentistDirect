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

export const getSlotsByDentist = async (req, res) => {
    try {
        const { dentistId } = req.params;
        const { date } = req.query;

        // Validate the required parameter
        if (!dentistId) {
            return res.status(400).json({ message: 'Dentist ID is required' });
        }

        // Build the query object
        const query = { dentistId };
        if (date) {
            query.date = date; // Filter by date if provided
        }

        // Fetch slots from the database
        const slots = await Slot.find(query).sort({ date: 1, startTime: 1 });

        // Check if slots are found
        if (!slots.length) {
            // Publish event to MQTT to indicate no slots were found
            mqttClient.publish(
                'slots/fetched',
                JSON.stringify({ dentistId, date, message: 'No slots found' })
            );
            return res.status(404).json({ message: 'No slots found for the given dentist' });
        }

        // Publish event to MQTT to indicate slots were fetched
        mqttClient.publish(
            'slots/fetched',
            JSON.stringify({ dentistId, date, count: slots.length })
        );
        // Respond with the found slots
        res.status(200).json({ message: 'Slots retrieved successfully', slots });
    } catch (error) {
        // Handle errors
        res.status(500).json({ message: 'Error retrieving slots', error });
    }
};