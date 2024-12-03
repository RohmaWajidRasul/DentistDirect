import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from '../database.js';
import mqttClient from '../../../shared/mqtt-client.js';
import { registerDentist } from './registerDentist.controller.js';
import morgan from'morgan';
import mongoose from 'mongoose';


dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));


connectDB();

const requestTopic = 'request/dentists/register';

mqttClient.on('connect', () => {
    console.log('MQTT connected for Register Dentist Service');
    mqttClient.subscribe( requestTopic, (err) => {
        if (err) {
            console.error(`Failed to subscribe to ${requestTopic}`, err);
        } else {
            console.log(`Subscribed to ${requestTopic}`);
        }
    });
});

mqttClient.on('message', registerDentist );

const publishHeartbeat = () => {
    const heartbeat = {
        service: 'Register Dentist Service',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    };

    mqttClient.publish('heartbeat/register-dentist', JSON.stringify(heartbeat), (err) => {
        if (err) {
            console.error('Failed to publish heartbeat:', err);
        } else {
            console.log('Heartbeat published for Register Dentist Service');
        }
    });
};

setInterval(publishHeartbeat, 5000);

const shutdown = async () => {
    console.log('Shutting down service...');

    mqttClient.unsubscribe(requestTopic, (err) => {
        if (err) {
            console.error('Failed to unsubscribe:', err);
        } else {
            console.log(`Unsubscribed from ${requestTopic}`);
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


