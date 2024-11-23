import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from '../database.js';
import mqttClient from '../../../shared/mqtt-client.js';
import { handleCancelSlotRequests } from './cancel-slot-controller.js';
import morgan from'morgan';


dotenv.config();

const app = express();

const PORT = process.env.PORT_SLOT_SERVICE || 5005;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));


connectDB();
mqttClient.on('connect', () => {
    console.log('MQTT connected for Cancel Slot Management Service');
    mqttClient.subscribe('request/slots/cancel', (err) => {
        if (err) {
            console.error('Failed to subscribe to request/slots/cancel:', err);
        } else {
            console.log('Subscribed to request/slots/cancel');
        }
    });
});

mqttClient.on('message', handleCancelSlotRequests);


app.listen(PORT, () => {
    console.log(`Slot Management Service running on port ${PORT}`);
});
