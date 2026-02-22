import { Request, Response } from 'express';
import mongoose from 'mongoose';
import MedicineReminder from '../models/MedicineReminder';
import User from '../models/User';

const resolvePatientId = async (input: string) => {
    if (mongoose.Types.ObjectId.isValid(input)) return input;
    const user = await User.findOne({ firebaseUid: input });
    return user ? user._id : null;
};

export const getReminders = async (req: Request, res: Response) => {
    try {
        const { patientId } = req.query;
        if (!patientId) return res.status(400).json({ error: 'patientId is required' });

        const resolvedId = await resolvePatientId(patientId as string);
        if (!resolvedId) return res.json([]);

        const reminders = await MedicineReminder.find({ patientId: resolvedId });
        res.json(reminders);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const addReminder = async (req: Request, res: Response) => {
    try {
        const { patientId, medicineName, dosage, reminderTimes, frequency } = req.body;
        const resolvedId = await resolvePatientId(patientId);
        if (!resolvedId) return res.status(404).json({ error: 'User not found' });

        const reminder = await MedicineReminder.create({
            patientId: resolvedId,
            medicineName,
            dosage,
            reminderTimes,
            frequency
        });

        res.status(201).json(reminder);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const toggleReminder = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const reminder = await MedicineReminder.findById(id);
        if (!reminder) return res.status(404).json({ error: 'Reminder not found' });

        reminder.isActive = !reminder.isActive;
        await reminder.save();
        res.json(reminder);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const markTaken = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const reminder = await MedicineReminder.findById(id);
        if (!reminder) return res.status(404).json({ error: 'Reminder not found' });

        reminder.takenHistory.push({ timestamp: new Date(), taken: true });
        await reminder.save();
        res.json(reminder);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const removeReminder = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await MedicineReminder.findByIdAndDelete(id);
        res.json({ message: 'Reminder removed' });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};
