import { Request, Response } from 'express';
import { geminiService } from '../services/geminiService';

export const chatWithAI = async (req: Request, res: Response) => {
    try {
        const { message, history, userContext } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const response = await geminiService.generateHealthResponse(message, userContext);

        res.json({ response });

    } catch (error) {
        console.error('Error in chat controller:', error);
        res.status(500).json({ error: 'Failed to generate chat response' });
    }
};
