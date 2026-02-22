import { Router } from 'express';
import { getDoctors, getDoctorById, completeProfile } from '../controllers/doctorController';
import { protect } from '../utils/authMiddleware';

const router = Router();

router.get('/doctors', protect, getDoctors);
router.get('/doctors/:id', protect, getDoctorById);
router.post('/doctors/profile', protect, completeProfile);

export default router;
