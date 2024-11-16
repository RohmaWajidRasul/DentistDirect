import express from 'express';
import { getSlotsByDentist, createSlot } from './slot.controller.js';

const router = express.Router();

router.post('/create', createSlot);
router.get('/slots/:dentistId', getSlotsByDentist)

export default router;
