import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from '../database.js';
import mqttClient from '../../../shared/mqtt-client.js';
import mongoose from 'mongoose';
import { createAppointment } from './createAppointment.controller.js';
import morgan from'morgan';


dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));


connectDB();
mqttClient.on('connect', () => {
    console.log('MQTT connected for Create Appointment Service');
    mqttClient.subscribe('request/appointments/create', (err) => {
        if (err) {
            console.error('Failed to subscribe to request/appointments/create:', err);
        } else {
            console.log('Subscribed to request/appointments/create');
        }
    });
});

mqttClient.on('message', createAppointment);

const publishHeartbeat = () => {
    const heartbeat = {
        service: 'Create Appointment Service',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    };

    mqttClient.publish('heartbeat/create-appointment', JSON.stringify(heartbeat), (err) => {
        if (err) {
            console.error('Failed to publish heartbeat:', err);
        }
    });
};

setInterval(publishHeartbeat, 5000);

const shutdown = async () => {
    console.log('Shutting down service...');

    mqttClient.unsubscribe('request/appointments/create', (err) => {
        if (err) {
            console.error('Failed to unsubscribe:', err);
        } else {
            console.log('Unsubscribed from request/appointments/create');
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



