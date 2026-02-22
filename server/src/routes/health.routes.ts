import express from 'express';
import {
    getHealthProfile, saveHealthProfile,
    getHealthEntries, addHealthEntry, removeHealthEntry
} from '../controllers/healthController';
import { protect } from '../utils/authMiddleware';

const router = express.Router();

// Health Profile
router.get('/profile', protect, getHealthProfile);
router.post('/profile', protect, saveHealthProfile);

// Health Entries
router.get('/entries', protect, getHealthEntries);
router.post('/entries', protect, addHealthEntry);
router.delete('/entries/:id', protect, removeHealthEntry);

export default router;
