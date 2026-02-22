import { Request, Response } from 'express';
import mongoose from 'mongoose';
import HospitalFavorite from '../models/HospitalFavorite';
import User from '../models/User';

const resolvePatientId = async (input: string) => {
    if (mongoose.Types.ObjectId.isValid(input)) return input;
    const user = await User.findOne({ firebaseUid: input });
    return user ? user._id : null;
};

export const getFavorites = async (req: Request, res: Response) => {
    try {
        const { patientId } = req.query;
        if (!patientId) return res.status(400).json({ error: 'patientId is required' });

        const resolvedId = await resolvePatientId(patientId as string);
        if (!resolvedId) return res.json([]);

        const favorites = await HospitalFavorite.find({ patientId: resolvedId });
        res.json(favorites);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const addFavorite = async (req: Request, res: Response) => {
    try {
        const { patientId, name, address, phone, type, lat, lng } = req.body;
        const resolvedId = await resolvePatientId(patientId);
        if (!resolvedId) return res.status(404).json({ error: 'User not found' });

        const favorite = await HospitalFavorite.findOneAndUpdate(
            { patientId: resolvedId, name },
            { address, phone, type, lat, lng },
            { upsert: true, new: true }
        );

        res.status(201).json(favorite);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const removeFavorite = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await HospitalFavorite.findByIdAndDelete(id);
        res.json({ message: 'Favorite removed' });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};
