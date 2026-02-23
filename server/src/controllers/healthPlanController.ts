import { Request, Response } from 'express';
import PatientActivePlan from '../models/PatientActivePlan';

export const initializePlan = async (req: Request, res: Response) => {
    try {
        const { patientId, planId, planName, category } = req.body;

        if (!patientId || !planId) {
            return res.status(400).json({ error: 'patientId and planId are required' });
        }

        // Deactivate existing plan if any
        await PatientActivePlan.updateMany(
            { patientId, status: 'active' },
            { status: 'completed', completedAt: new Date() }
        );

        const newPlan = await PatientActivePlan.create({
            patientId,
            planId,
            planName,
            category,
            status: 'active',
            completedActivities: []
        });

        res.status(201).json(newPlan);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const completeActivityDirect = async (req: Request, res: Response) => {
    try {
        const { patientId, planId, activityId } = req.body;

        const activePlan = await PatientActivePlan.findOne({
            patientId,
            planId,
            status: 'active'
        });

        if (!activePlan) {
            return res.status(404).json({ error: 'Active plan not found' });
        }

        if (!activePlan.completedActivities.includes(activityId)) {
            activePlan.completedActivities.push(activityId);
            await activePlan.save();
        }

        res.json(activePlan);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const getActivePlan = async (req: Request, res: Response) => {
    try {
        const { patientId } = req.query;
        if (!patientId) return res.status(400).json({ error: 'patientId is required' });

        const activePlan = await PatientActivePlan.findOne({
            patientId: patientId as string,
            status: 'active'
        });

        res.json(activePlan || null);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};
