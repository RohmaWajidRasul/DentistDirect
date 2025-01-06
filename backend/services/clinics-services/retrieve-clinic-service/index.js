import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from '../../../shared/database.js';
import mqttClient from '../../../shared/mqtt-client.js';
import { retrieveClinics } from './retrieveClinic.controller.js';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const primaryURI = process.env.CLINICDB_PRIMARY_URI || 'mongodb://localhost:27017/clinics';
const fallbackURI = process.env.CLINICDB_FALLBACK_URI || 'mongodb://localhost:27019/clinics';

connectDB(primaryURI, fallbackURI, "clinicDB");

// Generates a unique service ID for this service
const serviceId = uuidv4();

const publishRegistration = () => {
    const registration = {
        serviceId, 
        serviceName: 'retrieve-clinics', 
        status: 'healthy',
        timestamp: new Date().toISOString(),
    };

    mqttClient.publish('registry/register', JSON.stringify(registration), (err) => {
        if (err) {
            console.error('Failed to publish registration:', err);
        } else {
            console.log('Service registered successfully');
        }
    });
};

const requestTopic = `request/retrieve-clinics/${serviceId}`;

mqttClient.on('connect', () => {
    console.log('MQTT connected for Retrieve Clinic Service');
    publishRegistration(); 

    mqttClient.subscribe(requestTopic, (err) => {
        if (err) {
            console.error(`Failed to subscribe to ${requestTopic}`, err);
        } else {
            console.log(`Subscribed to ${requestTopic}`);
        }
    });
});

mqttClient.on('message', (topic, message) => {
    if (topic === requestTopic) {
        retrieveClinics(topic, message);
    }
});

const publishHeartbeat = () => {
    const heartbeat = {
        service: 'retrieve-clinics',
        status: 'healthy',
        timestamp: Date.now(),
        uptime: process.uptime(), 
    };

    mqttClient.publish(`heartbeat/retrieve-clinics/${serviceId}`, JSON.stringify(heartbeat), (err) => {
        if (err) {
            console.error('Failed to publish heartbeat:', err);
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
