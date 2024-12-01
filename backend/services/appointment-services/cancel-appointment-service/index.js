import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from '../database.js';
import mqttClient from '../../../shared/mqtt-client.js'; 
import { cancelAppointment } from './cancelAppointment.controller.js';
import morgan from 'morgan';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

connectDB();

mqttClient.on('connect', () => {
    console.log('MQTT connected for Cancel Appointment Service');
    
    mqttClient.subscribe('request/appointments/cancel', (err) => {
        if (err) {
            console.error('Failed to subscribe to request/appointments/cancel:', err);
        } else {
            console.log('Subscribed to request/appointments/cancel');
        }
    });
});

mqttClient.on('message', cancelAppointment);

