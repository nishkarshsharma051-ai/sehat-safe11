import { Router } from 'express';
import { getAppointments, createAppointment, updateAppointmentStatus, bulkUpdateStatus } from '../controllers/appointmentController';
import { protect, isAdmin } from '../utils/authMiddleware';

const router = Router();

router.get('/appointments', protect, getAppointments);
router.post('/appointments', protect, createAppointment);
router.patch('/appointments/bulk-status', protect, isAdmin, bulkUpdateStatus);
router.patch('/appointments/:id/status', protect, updateAppointmentStatus);

export default router;
