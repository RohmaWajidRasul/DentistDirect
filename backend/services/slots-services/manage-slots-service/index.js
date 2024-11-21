import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from '../database.js';
import mqttClient from '../../../shared/mqtt-client.js';
import { handleSlotRequest } from './slot.controller.js';
import morgan from'morgan';


dotenv.config();

const app = express();

const PORT = process.env.PORT_SLOT_SERVICE || 5001;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));


connectDB();
mqttClient.on('connect', () => {
    console.log('MQTT connected for Slot Management Service');
    mqttClient.subscribe('request/slots/create', (err) => {
        if (err) {
            console.error('Failed to subscribe to request/slots/create:', err);
        } else {
            console.log('Subscribed to request/slots/create');
        }
    });
});

mqttClient.on('message', handleSlotRequest);


app.listen(PORT, () => {
    console.log(`Slot Management Service running on port ${PORT}`);
});
