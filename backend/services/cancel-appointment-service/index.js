import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from '../slots-services/database.js';
import mqttClient from '../../shared/mqtt-client.js'; 
import { cancelAppointment } from '../cancel-appointment-service/cancellation-controller.js';
import morgan from 'morgan';

dotenv.config();

const app = express();

const PORT = process.env.PORT_APPOINTMENT_SERVICE || 5004;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

connectDB();

mqttClient.on('connect', () => {
    console.log('MQTT connected for Appointment Management Service');
    
    mqttClient.subscribe('request/appointments/cancel', (err) => {
        if (err) {
            console.error('Failed to subscribe to request/appointments/cancel:', err);
        } else {
            console.log('Subscribed to request/appointments/cancel');
        }
    });
});

mqttClient.on('message', cancelAppointment);

app.listen(PORT, () => {
    console.log(`Appointment Management Service running on port ${PORT}`);
});

