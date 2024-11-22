import express from 'express';
import { createPatient } from '../../services/dentist-and-patient/patient.controller.js';

const router = express.Router();

router.post('/', createPatient);

export default router;
