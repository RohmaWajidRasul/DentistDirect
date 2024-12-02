import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './database.js';
import mqttClient from '../../shared/mqtt-client.js';
import { registerDentist } from './registerDentist.controller.js';
import { fetchDentistInfo } from './fetchDentistInfo.controller.js';
import morgan from 'morgan';
import mongoose from 'mongoose';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

connectDB();

const topicHandlers = {
    'request/dentists/register': registerDentist,
    'request/dentists/info': fetchDentistInfo,
};

mqttClient.on('connect', () => {
    console.log('MQTT connected for Dentist Service');
    
    Object.keys(topicHandlers).forEach((topic) => {
        mqttClient.subscribe(topic, (err) => {
            if (err) {
                console.error(`Failed to subscribe to ${topic}`, err);
            } else {
                console.log(`Subscribed to ${topic}`);
            }
        });
    });
});

mqttClient.on('message', (topic, message) => {
    const handler = topicHandlers[topic];

    if (handler) {
        console.log(`Message received on topic: ${topic}`);
        handler(topic, message); 
    } else {
        console.error(`No handler found for topic: ${topic}`);
    }
});

const publishHeartbeat = () => {
    const heartbeat = {
        service: 'Dentist Service',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    };

    mqttClient.publish('heartbeat/dentist-service', JSON.stringify(heartbeat), (err) => {
        if (err) {
            console.error('Failed to publish heartbeat:', err);
        }
    });
};

setInterval(publishHeartbeat, 5000);

const shutdown = async () => {
    console.log('Shutting down service...');

    Object.keys(topicHandlers).forEach((topic) => {
        mqttClient.unsubscribe(topic, (err) => {
            if (err) {
                console.error(`Failed to unsubscribe from ${topic}:`, err);
            } else {
                console.log(`Unsubscribed from ${topic}`);
            }
        });
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
