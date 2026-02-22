import express from 'express';
import {
    getInsuranceRecords, addInsuranceRecord, removeInsuranceRecord,
    getFamilyMembers, addFamilyMember, removeFamilyMember
} from '../controllers/additionalDataController';
import { protect } from '../utils/authMiddleware';

const router = express.Router();

// Insurance
router.get('/insurance', protect, getInsuranceRecords);
router.post('/insurance', protect, addInsuranceRecord);
router.delete('/insurance/:id', protect, removeInsuranceRecord);

// Family
router.get('/family', protect, getFamilyMembers);
router.post('/family', protect, addFamilyMember);
router.delete('/family/:id', protect, removeFamilyMember);

export default router;
