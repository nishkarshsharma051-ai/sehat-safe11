import { Router } from 'express';
import { getDoctors, getDoctorById } from '../controllers/doctorController';

const router = Router();

router.get('/doctors', getDoctors);
router.get('/doctors/:id', getDoctorById);

export default router;
