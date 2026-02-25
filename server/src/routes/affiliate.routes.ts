import express from 'express';
import { affiliateController } from '../controllers/affiliateController';
import { protect } from '../utils/authMiddleware';

const router = express.Router();

router.get('/', protect, affiliateController.getAll);
router.get('/:id', protect, affiliateController.getById);
router.post('/', protect, affiliateController.create);

export default router;
