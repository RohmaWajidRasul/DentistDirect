import express from 'express';
import { getSlotsByDentist } from './available-controller.js';

const router = express.Router();

router.get('/:dentistId', getSlotsByDentist)

export default router;