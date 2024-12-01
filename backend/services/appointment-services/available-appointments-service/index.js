import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from '../../appointment-services/database.js';
import mqttClient from '../../../shared/mqtt-client.js';
import { getAvailableAppointments } from './getAvailableAppointment.controller.js';
import morgan from'morgan';
import mongoose from 'mongoose';


dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));


connectDB();

mqttClient.on('connect', () => {
    console.log('MQTT connected for Available Appointments Service');
    mqttClient.subscribe('request/appointments/availability/fetch', (err) => {
        if (err) {
            console.error('Failed to subscribe to request/appointments/availability/fetch:', err);
        } else {
            console.log('Subscribed to request/appointments/availability/fetch');
        }
    });
});

mqttClient.on('message', getAvailableAppointments);

const shutdown = async () => {
    console.log('Shutting down service...');

    mqttClient.unsubscribe('request/appointments/availability/fetch', (err) => {
        if (err) {
            console.error('Failed to unsubscribe:', err);
        } else {
            console.log('Unsubscribed from request/appointments/availability/fetch');
        }
    });

    mqttClient.end(false, () => {
        console.log('MQTT client disconnected');
    });

    try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
    } catch (err) {
        console.error('Error closing MongoDB connection:', err);
    }

    process.exit(0);
};

process.on('SIGINT', shutdown); 
process.on('SIGTERM', shutdown); 


