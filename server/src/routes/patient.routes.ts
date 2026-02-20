import { Router } from 'express';
import { getPatients, getDoctorPatients } from '../controllers/patientController';

const router = Router();

router.get('/', getPatients);
router.get('/doctor/:doctorId', getDoctorPatients);

export default router;
