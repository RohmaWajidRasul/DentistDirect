import express from 'express';
import { createSlot } from './slot.controller.js';

const router = express.Router();

router.post('/create', createSlot);

export default router;
