import express from 'express';
import { getFavorites, addFavorite, removeFavorite } from '../controllers/hospitalController';
import { protect } from '../utils/authMiddleware';

const router = express.Router();

router.get('/favorites', protect, getFavorites);
router.post('/favorites', protect, addFavorite);
router.delete('/favorites/:id', protect, removeFavorite);

export default router;
