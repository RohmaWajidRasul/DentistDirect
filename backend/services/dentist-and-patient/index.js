import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from '../slots-services/database.js';
import patientRouter from '../../api/routes/patient.router.js';
import mqttClient from '../../shared/mqtt-client.js';
import dentistRouter from './dentist.router.js';
import morgan from'morgan';
import { createPatientRequest } from '../patient-services/create-patient-service/createPatient.controller.js';
dotenv.config();

const app = express();

const PORT = process.env.PORT_SLOT_SERVICE || 5007;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

connectDB();
mqttClient.on('connect', () => {
    console.log('MQTT connected for Patient Management Service');

    mqttClient.subscribe('request/patient/create', (err) => {
        if(err){
            console.error('Failed to subscribe to request/patient/create:', err);
        } else {
            console.log('Subscribed to request/patient/create');
        }
    });

});
mqttClient.on('message', createPatientRequest); 

app.use('/v1/dentists', dentistRouter);
app.use('/v1/patients', patientRouter);

app.use('/*', function (req, res) {
    res.status(404).json({ message: 'Not Found' });
});

app.listen(PORT, () => {
    console.log(`Dentist and Patient Service running on port ${PORT}`);
});
