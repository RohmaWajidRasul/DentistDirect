import express from 'express';
import appointmentRoutes from './routes/appointment.router.js';
import patientRoutes from './routes/patient.router.js'; 
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from'morgan';
import mqttClient from '../shared/mqtt-client.js';
import clinicRoutes from './routes/clinic.router.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT_GATEWAY || 3000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (req, res) => res.send('Backend running'));

app.use('/v1/appointments', appointmentRoutes);

app.use('/v1/patients', patientRoutes); 

app.use('/v1/clinics',clinicRoutes);

app.use('/*', function (req, res) {
    res.status(404).json({ message: 'Not Found' });
});

process.on('SIGINT', async () => {
    console.log('Gracefully shutting down...');
    try {
        await new Promise((resolve, reject) => {
            mqttClient.end(false, (err) => {
                if (err) {
                    console.error('Failed to disconnect MQTT client:', err);
                    reject(err);
                } else {
                    console.log('MQTT client disconnected');
                    resolve();
                }
            });
        });

        console.log('Shutdown complete. Exiting process.');
        process.exit(0); 
    } catch (err) {
        console.error('Error during shutdown:', err);
        process.exit(1); 
    }
});

app.listen(PORT, () => {
    console.log(`API Gateway running on http://localhost:${PORT}`);
});