import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from '../../shared/database.js';
import mqttClient from '../../shared/mqtt-client.js';
import { registerDentist } from './register-dentist-service/registerDentist.controller.js';
import { fetchDentistInfo } from './dentist-info-service/fetchDentistInfo.controller.js';
import { loginDentist } from './login-dentist-service/loginDentist.controller.js';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const primaryURI = process.env.DENTISTDB_PRIMARY_URI || 'mongodb://localhost:27017/dentists';
const fallbackURI = process.env.DENTISTDB_FALLBACK_URI || 'mongodb://localhost:27019/dentists';
connectDB(primaryURI, fallbackURI, 'dentistDB');

const serviceId = uuidv4();
const serviceName = 'dentist-service';

const registerTopic = `request/dentists/register/${serviceId}`;
const infoTopic = `request/dentists/info/${serviceId}`;
const loginTopic = `request/dentists/login/${serviceId}`;

const topicHandlers = {
    [registerTopic]: registerDentist,
    [infoTopic]: fetchDentistInfo,
    [loginTopic]: loginDentist
};

// Register the service with the registry
const publishRegistration = () => {
    const registration = {
        serviceId,
        serviceName,
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

// Subscribe to instance-specific topics
mqttClient.on('connect', () => {
    console.log('MQTT connected for Dentist Service');
    publishRegistration();

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

// Handle incoming MQTT messages
mqttClient.on('message', (topic, message) => {
    const handler = topicHandlers[topic];
    if (handler) {
        console.log(`Message received on topic: ${topic}`);
        handler(topic, message);
    } else {
        console.error(`No handler found for topic: ${topic}`);
    }
});

// Publish heartbeat messages
const publishHeartbeat = () => {
    const heartbeat = {
        service: serviceName,
        serviceId,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    };

    mqttClient.publish(`heartbeat/${serviceName}/${serviceId}`, JSON.stringify(heartbeat), (err) => {
        if (err) {
            console.error('Failed to publish heartbeat:', err);
        }
    });
};

setInterval(publishHeartbeat, 5000);

// Graceful shutdown
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
