import { Router } from 'express';
import { chatWithAI } from '../controllers/chatController';

const router = Router();

router.post('/chat', chatWithAI);

export default router;
