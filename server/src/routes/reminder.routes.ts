import express from 'express';
import { getReminders, addReminder, toggleReminder, markTaken, removeReminder } from '../controllers/reminderController';
import { protect } from '../utils/authMiddleware';

const router = express.Router();

router.get('/', protect, getReminders);
router.post('/', protect, addReminder);
router.patch('/:id/toggle', protect, toggleReminder);
router.post('/:id/taken', protect, markTaken);
router.delete('/:id', protect, removeReminder);

export default router;
