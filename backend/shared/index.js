import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mqttClient from './mqtt-client.js';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));




const serviceId = uuidv4();






const requestTopic = "#"

mqttClient.on('connect', () => {
    console.log('MQTT connected for Patient Login Service');

    mqttClient.subscribe(requestTopic, (err) => {
        if (err) {
            console.error(`Failed to subscribe to ${requestTopic}`, err);
        } else {
            console.log(`Subscribed to ${requestTopic}`);
        }
    });
});

mqttClient.on('message', (topic, message) => {
    console.log(topic + " message: " + message)
});



