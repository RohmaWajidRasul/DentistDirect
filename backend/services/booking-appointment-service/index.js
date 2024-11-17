import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from '../database.js';
import mqttClient from '../../shared/mqtt-client.js';
import { handleAppointmentRequest } from './appointment.controller.js';
import morgan from'morgan';


dotenv.config();

const app = express();

const PORT = process.env.PORT_SLOT_SERVICE || 5002;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));


connectDB();
mqttClient.on('connect', () => {
    console.log('MQTT connected for Slot Management Service');
    mqttClient.subscribe('request/appointments/create', (err) => {
        if (err) {
            console.error('Failed to subscribe to request/appointments/create:', err);
        } else {
            console.log('Subscribed to request/appointments/create');
        }
    });
});

mqttClient.on('message', handleAppointmentRequest);


app.listen(PORT, () => {
    console.log(`booking appointment Service running on port ${PORT}`);
});
