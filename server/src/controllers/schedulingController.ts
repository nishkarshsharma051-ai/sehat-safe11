import { Request, Response } from 'express';
import { schedulingService } from '../services/schedulingService';

export const schedulingController = {
    async getColleagues(req: Request, res: Response) {
        try {
            const { doctorId } = req.params;
            const colleagues = await schedulingService.suggestSwaps(doctorId);
            res.json(colleagues);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    },

    async requestSwap(req: Request, res: Response) {
        try {
            const { requesterId, targetDoctorId, shiftDate, notes } = req.body;
            const swap = await schedulingService.requestSwap(requesterId, targetDoctorId, new Date(shiftDate), notes);
            res.status(201).json(swap);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    },

    async getSwaps(req: Request, res: Response) {
        try {
            const { doctorId } = req.params;
            const swaps = await schedulingService.getUserSwaps(doctorId);
            res.json(swaps);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }
};
