import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from '../database.js';
import mqttClient from '../../../shared/mqtt-client.js';
import { bookAppointment } from './bookAppointment.controller.js';
import morgan from'morgan';
import mongoose from 'mongoose';


dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));


connectDB();
mqttClient.on('connect', () => {
    console.log('MQTT connected for Booking Appointment Service');
    mqttClient.subscribe('request/appointments/book', (err) => {
        if (err) {
            console.error('Failed to subscribe to request/appointments/book:', err);
        } else {
            console.log('Subscribed to request/appointments/book');
        }
    });
});

mqttClient.on('message', bookAppointment);

const shutdown = async () => {
    console.log('Shutting down service...');

    mqttClient.unsubscribe('request/appointments/book', (err) => {
        if (err) {
            console.error('Failed to unsubscribe:', err);
        } else {
            console.log('Unsubscribed from request/appointments/book');
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



