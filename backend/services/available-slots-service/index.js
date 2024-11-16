import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from '../../shared/database.js';
import mqttClient from '../../shared/mqtt-client.js';
import availableRoutes from './available-router.js';
import morgan from'morgan';


dotenv.config();

const app = express();

const PORT = process.env.PORT_AVAILABLE_SERVICE || 5003;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));


connectDB();
mqttClient.on('connect', () => console.log('MQTT connected for Available Slots Service'));

app.use('/v1/slots', availableRoutes);

app.listen(PORT, () => {
    console.log(`Available Slots Service running on port ${PORT}`);
});
