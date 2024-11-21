import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from '../database.js';
import mqttClient from '../../shared/mqtt-client.js';
import { handleAvailabilityRequest } from './available-controller.js';
import morgan from'morgan';


dotenv.config();

const app = express();

const PORT = process.env.PORT_AVAILABLE_SERVICE || 5003;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));


connectDB();
mqttClient.on('connect', () => {
    console.log('MQTT connected for Available Slots Service');
    mqttClient.subscribe('request/availability/fetch', (err) => {
        if (err) {
            console.error('Failed to subscribe to request/availability/fetch:', err);
        } else {
            console.log('Subscribed to request/availability/fetch');
        }
    });
});

mqttClient.on('message', handleAvailabilityRequest);

app.listen(PORT, () => {
    console.log(`Available Slots Service running on port ${PORT}`);
});
