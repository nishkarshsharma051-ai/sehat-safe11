import express from 'express';
import {
    getHealthProfile, saveHealthProfile,
    getHealthEntries, addHealthEntry, removeHealthEntry, uploadRecord,
    getSymptomLogs, addSymptomLog, getEmergencyProfile
} from '../controllers/healthController';
import { protect } from '../utils/authMiddleware';
import multer from 'multer';

const router = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max
});

// Health Profile
router.get('/profile', protect, getHealthProfile);
router.post('/profile', protect, saveHealthProfile);

// Health Entries
router.get('/entries', protect, getHealthEntries);
router.post('/entries', protect, addHealthEntry);
router.delete('/entries/:id', protect, removeHealthEntry);
router.post('/upload-record', protect, upload.single('file'), uploadRecord);

// Symptom Logs
router.get('/symptoms', protect, getSymptomLogs);
router.post('/symptoms', protect, addSymptomLog);

// Emergency Access (Public or Special Access)
router.get('/emergency/:patientId', getEmergencyProfile); // No protection for emergency access

export default router;
