import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from '../../shared/database.js';
import mqttClient from '../../shared/mqtt-client.js';
import appointmentRouter from './appointment.router.js';
import morgan from'morgan';

dotenv.config();

const app = express();

const PORT = process.env.PORT_SLOT_SERVICE || 5002;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

connectDB();
mqttClient.on('connect', () => console.log('MQTT connected for Slot Management Service'));

app.use('/v1/appointments', appointmentRouter);

app.use('/*', function (req, res) {
    res.status(404).json({ 'message': 'Not Found' });
});

app.listen(PORT, () => {
    console.log(`Slot Management Service running on port ${PORT}`);
});
