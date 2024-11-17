import express from "express";
import dotenv from 'dotenv'; 
import cors from 'cors'; 
import connectDB from "../../shared/database.js";
import mqttClient from "../../shared/mqtt-client.js";
import cancellationRoutes from './cancellation-router.js'; 
import morgan from "morgan";

dotenv.config(); 

const app = express(); 

const PORT = process.env.PORT_APPOINTMENT_SERVICE || 5002; 

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

connectDB(); 

mqttClient.on('connect', () => console.log('MQTT connected for appointment service')); 

app.use('/v1/appointments', cancellationRoutes);

app.listen(PORT, () => {
    console.log(`Appointment Management Service running on port ${PORT}`);
});