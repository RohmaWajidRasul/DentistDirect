import Slot from '../models/slot.js';
import mqttClient from '../../shared/mqtt-client.js';

export const handleSlotRequest = async (topic, message) => {
    console.log(`Request received on topic: ${topic}`);

    if (topic !== 'request/slots/create') {
        return;
    }

    let correlationId;

    try {

        const parsedMessage = JSON.parse(message.toString());
        correlationId = parsedMessage.correlationId;

        if (!correlationId) {
            throw new Error('Correlation ID is missing in the request'); 
        }

        const { dentistId, date, startTime, endTime } = parsedMessage.payload;


        if (!dentistId || !date || !startTime || !endTime) {
            const errorResponse = {
                correlationId,
                status: 'error',
                message: 'All fields are required',
            };
            return publishResponse(correlationId, errorResponse);
        }

        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);
        const duration = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);

        if (duration <= 0) {
            const errorResponse = {
                correlationId,
                status: 'error',
                message: 'End time must be after start time',
            };
            return publishResponse(correlationId, errorResponse);
        }

        const slot = new Slot({ dentistId, date, startTime, endTime, duration });
        await slot.save();

        const successResponse = {
            correlationId,
            status: 'success',
            message: 'Slot created successfully',
            slot,
        };
        return publishResponse(correlationId, successResponse);
    } catch (error) {
        if (!correlationId) {
            console.error('Critical error: Correlation ID is missing or undefined.', error.message);
            return;
        }

        const errorResponse = {
            correlationId,
            status: 'error',
            message: 'Error creating slot',
            error: error.message,
        };
        return publishResponse(correlationId, errorResponse);
    }
};

const publishResponse = (correlationId, response) => {
    const responseTopic = `response/slots/created/${correlationId}`;
    mqttClient.publish(responseTopic, JSON.stringify(response), (err) => {
        if (err) {
            console.error(`Failed to publish to ${responseTopic}:`, err);
        } else {
            console.log(`Response sent to ${responseTopic}`);
        }
    });
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