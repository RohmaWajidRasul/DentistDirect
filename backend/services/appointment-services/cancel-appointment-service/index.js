import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from '../database.js';
import mqttClient from '../../../shared/mqtt-client.js'; 
import { cancelAppointment } from './cancelAppointment.controller.js';
import morgan from 'morgan';
import mongoose from 'mongoose';

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

const shutdown = async () => {
    console.log('Shutting down service...');

    mqttClient.unsubscribe('request/appointments/cancel', (err) => {
        if (err) {
            console.error('Failed to unsubscribe:', err);
        } else {
            console.log('Unsubscribed from request/appointments/cancel');
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
