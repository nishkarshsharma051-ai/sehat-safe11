import express from 'express';
import { workloadController } from '../controllers/workloadController';

const router = express.Router();

router.get('/:doctorId', workloadController.getWorkload);

export default router;
