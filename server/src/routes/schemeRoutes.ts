import express from 'express';
import { matchSchemes, getAllSchemes } from '../controllers/schemeController';
import { protect } from '../utils/authMiddleware';

const router = express.Router();

router.get('/match', protect, matchSchemes);
router.get('/all', protect, getAllSchemes);

export default router;
