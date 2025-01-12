import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from '../../../shared/database.js';
import mqttClient from '../../../shared/mqtt-client.js';
import morgan from'morgan';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { deleteLogs } from './deleteLogs.controller.js'

const primaryURI = process.env.PATIENTDB_PRIMARY_URI || 'mongodb://localhost:27017/logs';
const fallbackURI = process.env.PATIENTDB_FALLBACK_URI || 'mongodb://localhost:27019/logs';

connectDB(primaryURI, fallbackURI, "patientDB");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const serviceId = uuidv4();
const serviceName = "delete-logs";


const publishRegistration = () => {
    const registration = {
        serviceId,
        serviceName: serviceName,
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

const publishHeartbeat = () => {
    const heartbeat = {
        service: `${serviceName}`,
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

//Deletes the logs that are older than a day every hour
setInterval(deleteLogs, 3600000)


mqttClient.on('connect', () => {
    console.log('MQTT connected for Delete Logs Service');
    publishRegistration();
});


const shutdown = async () => {
    console.log('Shutting down service...');


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