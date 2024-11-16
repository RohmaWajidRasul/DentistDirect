import express from 'express';
import { createAppointment } from './appointment.controller.js';

const router = express.Router();

router.post('/', createAppointment);

export default router;
