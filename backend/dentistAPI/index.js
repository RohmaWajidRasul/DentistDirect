import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './database.js';
import dentistRouter from './dentist.router.js';
import morgan from'morgan';
dotenv.config();

const app = express();

const PORT = process.env.PORT_DENTIST_API || 5007;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

connectDB();

app.use('/v1/dentists', dentistRouter);

app.use('/*', function (req, res) {
    res.status(404).json({ message: 'Not Found' });
});

app.listen(PORT, () => {
    console.log(`Dentist API running on port ${PORT}`);
});
