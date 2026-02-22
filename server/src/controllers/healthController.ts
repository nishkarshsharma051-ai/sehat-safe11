import { Request, Response } from 'express';
import mongoose from 'mongoose';
import HealthProfile from '../models/HealthProfile';
import HealthEntry from '../models/HealthEntry';
import User from '../models/User';

const resolvePatientId = async (input: string) => {
    if (mongoose.Types.ObjectId.isValid(input)) return input;
    const user = await User.findOne({ firebaseUid: input });
    return user ? user._id : null;
};

// ─── Health Profile ──────────────────────────────────
export const getHealthProfile = async (req: Request, res: Response) => {
    try {
        const { patientId } = req.query;
        if (!patientId) return res.status(400).json({ error: 'patientId is required' });

        const resolvedId = await resolvePatientId(patientId as string);
        if (!resolvedId) return res.status(404).json({ error: 'User not found' });

        const profile = await HealthProfile.findOne({ patientId: resolvedId });
        res.json(profile);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const saveHealthProfile = async (req: Request, res: Response) => {
    try {
        const { patientId, ...profileData } = req.body;
        const resolvedId = await resolvePatientId(patientId);
        if (!resolvedId) return res.status(404).json({ error: 'User not found' });

        const profile = await HealthProfile.findOneAndUpdate(
            { patientId: resolvedId },
            { ...profileData, patientId: resolvedId },
            { upsert: true, new: true }
        );

        res.json(profile);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

// ─── Health Entries ──────────────────────────────────
export const getHealthEntries = async (req: Request, res: Response) => {
    try {
        const { patientId, type } = req.query;
        if (!patientId) return res.status(400).json({ error: 'patientId is required' });

        const resolvedId = await resolvePatientId(patientId as string);
        if (!resolvedId) return res.json([]);

        let query: any = { patientId: resolvedId };
        if (type) query.type = type;

        const entries = await HealthEntry.find(query).sort({ date: -1 });
        res.json(entries);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const addHealthEntry = async (req: Request, res: Response) => {
    try {
        const { patientId, date, type, title, description, values } = req.body;
        const resolvedId = await resolvePatientId(patientId);
        if (!resolvedId) return res.status(404).json({ error: 'User not found' });

        const entry = await HealthEntry.create({
            patientId: resolvedId,
            date,
            type,
            title,
            description,
            values
        });

        res.status(201).json(entry);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const removeHealthEntry = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await HealthEntry.findByIdAndDelete(id);
        res.json({ message: 'Entry removed' });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};
