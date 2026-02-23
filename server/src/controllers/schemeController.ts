import { Request, Response } from 'express';
import Scheme, { IScheme } from '../models/Scheme';
import User from '../models/User';
import HealthProfile from '../models/HealthProfile';

export const matchSchemes = async (req: Request, res: Response): Promise<void> => {
    try {
        const userReq = req as any;
        const userId = userReq.user?.id || userReq.user?._id;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        const healthProfile = await HealthProfile.findOne({ patientId: userId });

        const allSchemes = await Scheme.find({});

        const matchedSchemes = allSchemes.filter(scheme => {
            const elig = scheme.eligibility;

            // Age matching
            if (user.age) {
                if (elig.minAge && user.age < elig.minAge) return false;
                if (elig.maxAge && user.age > elig.maxAge) return false;
            }

            // Income matching
            if (elig.incomeLimit && user.annualIncome) {
                if (user.annualIncome > elig.incomeLimit) return false;
            }

            // Gender matching
            if (elig.gender && elig.gender !== 'all') {
                if (user.gender && user.gender.toLowerCase() !== elig.gender.toLowerCase()) return false;
            }

            // Health condition matching (matches if any condition in scheme is in user profile)
            if (elig.chronicConditions && elig.chronicConditions.length > 0) {
                if (!healthProfile) return false;
                const userConditions = healthProfile.chronicConditions || [];
                const hasMatchingCondition = elig.chronicConditions.some(c =>
                    userConditions.some(uc => uc.toLowerCase().includes(c.toLowerCase()))
                );
                if (!hasMatchingCondition) return false;
            }

            // PIN Code / State matching (Simple prefix check for now or state list)
            // A realistic version would map PIN to state.
            // For now, we'll assume state-based schemes have a list of states.
            // If scheme has states, and user has pinCode, we check if pin matches state.
            // Mock: first digit of PIN maps to some zones.

            return true;
        });

        res.json(matchedSchemes);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getAllSchemes = async (req: Request, res: Response): Promise<void> => {
    try {
        const schemes = await Scheme.find({});
        res.json(schemes);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
