import express from 'express';
import { createDentist } from './dentist.controller.js';

const router = express.Router();

router.post('/', createDentist);

export default router;
