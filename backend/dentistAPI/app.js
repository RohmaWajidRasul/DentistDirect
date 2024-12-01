import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import dentistRoutes from './routes/dentist.router.js';
import appointmentRoutes from './routes/appointment.router.js';

import morgan from'morgan';
dotenv.config();

const app = express();

const PORT = process.env.PORT_DENTIST_API || 5007;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/v1/appointments', appointmentRoutes);


app.use('/v1/dentists', dentistRoutes);

app.use('/*', function (req, res) {
    res.status(404).json({ message: 'Not Found' });
});

app.listen(PORT, () => {
    console.log(`Dentist API running on port ${PORT}`);
});
