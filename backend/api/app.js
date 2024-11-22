import express from 'express';
import slotRoutes from './routes/slotRoutes.js';
import cancellationRoutes from './routes/cancellation-router.js';
import appointmentRoutes from './routes/appointmentRoutes.js'
import availableSlotsRoutes from './routes/availableSlotsRoutes.js';
import cancelSlotRouter from './routes/cancel-slot-router.js';
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

app.use('/v1/appointments/cancel', cancellationRoutes);

app.use('/v1/appointments', appointmentRoutes);

app.use('/v1/slots/cancel', cancelSlotRouter);

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
