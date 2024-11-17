import express from 'express';
import slotRoutes from './routes/slotRoutes.js';
import cancellationRoutes from '../api/routes/cancellation-router.js';
import appointmentRoutes from './routes/appointmentRoutes.js'
import availableSlotsRoutes from './routes/availableSlotsRoutes.js';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from'morgan';
import mqttClient from '../shared/mqtt-client.js';


dotenv.config();
const app = express();
const PORT = process.env.PORT_GATEWAY || 3000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (req, res) => res.send('Backend running'));

app.use('/v1/slots/availability', availableSlotsRoutes);

app.use('/v1/slots', slotRoutes);
app.use('/v1/appointments', cancellationRoutes);

app.use('/v1/appointments', appointmentRoutes);
app.use('/v1/slots/:dentisId', availableSlotsRoutes);

process.on('SIGINT', () => {
    console.log('Gracefully shutting down...');
    mqttClient.end(() => {
        console.log('MQTT client disconnected');
        process.exit(0);
    });
});


process.on('SIGINT', () => {
    console.log('Gracefully shutting down...');
    mqttClient.end(() => {
        console.log('MQTT client disconnected');
        process.exit(0);
    });
});


app.listen(PORT, () => {
    console.log(`API Gateway running on http://localhost:${PORT}`);
});
