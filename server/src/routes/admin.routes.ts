import { Router } from 'express';
import { getStats, getAllUsers, getAllAppointments, getAllPrescriptions } from '../controllers/adminController';
import { protect, isAdmin } from '../utils/authMiddleware';

const router = Router();

// All routes are protected and admin only
router.use(protect);
router.use(isAdmin);

router.get('/stats', getStats);
router.get('/users', getAllUsers);
router.get('/appointments', getAllAppointments);
router.get('/prescriptions', getAllPrescriptions);

export default router;
