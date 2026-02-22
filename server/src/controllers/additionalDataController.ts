import { Request, Response } from 'express';
import mongoose from 'mongoose';
import InsuranceRecord from '../models/InsuranceRecord';
import FamilyMember from '../models/FamilyMember';
import User from '../models/User';

const resolvePatientId = async (input: string) => {
    if (mongoose.Types.ObjectId.isValid(input)) return input;
    const user = await User.findOne({ firebaseUid: input });
    return user ? user._id : null;
};

// ─── Insurance ───────────────────────────────────────
export const getInsuranceRecords = async (req: Request, res: Response) => {
    try {
        const { patientId } = req.query;
        if (!patientId) return res.status(400).json({ error: 'patientId is required' });

        const resolvedId = await resolvePatientId(patientId as string);
        if (!resolvedId) return res.json([]);

        const records = await InsuranceRecord.find({ patientId: resolvedId });
        res.json(records);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const addInsuranceRecord = async (req: Request, res: Response) => {
    try {
        const { patientId, provider, policyNumber, coverageType, expiryDate, premium } = req.body;
        const resolvedId = await resolvePatientId(patientId);
        if (!resolvedId) return res.status(404).json({ error: 'User not found' });

        const record = await InsuranceRecord.create({
            patientId: resolvedId,
            provider,
            policyNumber,
            coverageType,
            expiryDate,
            premium
        });

        res.status(201).json(record);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const removeInsuranceRecord = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await InsuranceRecord.findByIdAndDelete(id);
        res.json({ message: 'Insurance record removed' });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

// ─── Family ──────────────────────────────────────────
export const getFamilyMembers = async (req: Request, res: Response) => {
    try {
        const { parentId } = req.query;
        if (!parentId) return res.status(400).json({ error: 'parentId is required' });

        const resolvedId = await resolvePatientId(parentId as string);
        if (!resolvedId) return res.json([]);

        const members = await FamilyMember.find({ parentId: resolvedId });
        res.json(members);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const addFamilyMember = async (req: Request, res: Response) => {
    try {
        const { parentId, name, relationship, age } = req.body;
        const resolvedId = await resolvePatientId(parentId);
        if (!resolvedId) return res.status(404).json({ error: 'User not found' });

        const member = await FamilyMember.create({
            parentId: resolvedId,
            name,
            relationship,
            age
        });

        res.status(201).json(member);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const removeFamilyMember = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await FamilyMember.findByIdAndDelete(id);
        res.json({ message: 'Family member removed' });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};
