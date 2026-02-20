import { Router } from 'express';
import { getDoctors, createDoctor, getDoctorById } from '../controllers/doctorController';

const router = Router();

router.get('/doctors', getDoctors);
router.get('/doctors/:id', getDoctorById);

export default router;
