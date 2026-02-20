import { Router } from 'express';
import { login, verifyUser, register } from '../controllers/authController';

const router = Router();

router.post('/login', login);
router.post('/register', register); // New endpoint for Role Persistence
router.post('/verify', verifyUser);

export default router;
