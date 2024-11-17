import express from 'express'; 
import { cancelAppointment } from './cancellation-controller.js';

const router = express.Router(); 

router.post('/cancel', cancelAppointment); 

export default router;