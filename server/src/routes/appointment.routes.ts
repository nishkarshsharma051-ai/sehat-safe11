import { Router } from 'express';
import { getAppointments, createAppointment, updateAppointmentStatus, bulkUpdateStatus } from '../controllers/appointmentController';

const router = Router();

router.get('/appointments', getAppointments);
router.post('/appointments', createAppointment);
router.patch('/appointments/bulk-status', bulkUpdateStatus);
router.patch('/appointments/:id/status', updateAppointmentStatus);

export default router;
