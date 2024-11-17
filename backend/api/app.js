import express from 'express';
import slotRoutes from './routes/slotRoutes.js';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from'morgan';

dotenv.config();
const app = express();
const PORT = process.env.PORT_GATEWAY || 3000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (req, res) => res.send('Backend running'));

app.use('/v1/slots', slotRoutes);


app.listen(PORT, () => {
    console.log(`API Gateway running on http://localhost:${PORT}`);
});
