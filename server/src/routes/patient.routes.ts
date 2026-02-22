import { Router } from 'express';
import { getPatients, getDoctorPatients, createManualPatient } from '../controllers/patientController';
import { protect } from '../utils/authMiddleware';

const router = Router();

router.get('/', getPatients);
router.get('/doctor/:doctorId', getDoctorPatients);
router.post('/manual', protect, createManualPatient);

export default router;
