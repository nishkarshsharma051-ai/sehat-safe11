import { Request, Response } from 'express';
import { workloadService } from '../services/workloadService';

export const workloadController = {
    async getWorkload(req: Request, res: Response) {
        try {
            const { doctorId } = req.params;
            if (!doctorId) {
                return res.status(400).json({ message: 'Doctor ID is required' });
            }

            const currentWorkload = await workloadService.calculateCurrentWorkload(doctorId);
            const burnoutRisk = await workloadService.predictBurnout(doctorId);

            res.json({
                census: currentWorkload.census,
                averageAcuity: currentWorkload.averageAcuity,
                estimatedHours: currentWorkload.estimatedHours,
                burnoutRisk
            });
        } catch (error: any) {
            console.error('Error fetching workload:', error);
            res.status(500).json({ message: error.message });
        }
    }
};
