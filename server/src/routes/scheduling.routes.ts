import express from 'express';
import { schedulingController } from '../controllers/schedulingController';

const router = express.Router();

router.get('/colleagues/:doctorId', schedulingController.getColleagues);
router.post('/swap', schedulingController.requestSwap);
router.get('/swaps/:doctorId', schedulingController.getSwaps);

export default router;
