import mongoose from 'mongoose';
import { Request, Response } from 'express';
import Doctor from '../models/Doctor';
import User from '../models/User';

export const getDoctors = async (req: Request, res: Response) => {
    try {
        const doctors = await Doctor.find().populate('userId', 'name email');

        // Transform data to match frontend expectations if necessary
        // Or return as makes sense for the new schema
        const formattedDoctors = doctors.map(doc => ({
            id: doc._id,
            full_name: (doc.userId as unknown as { name: string }).name,
            specialization: doc.specialization,
            hospital_name: doc.hospitalName,
            availability: doc.availability,
            rating: doc.rating
        }));

        res.json({ doctors: formattedDoctors });
    } catch (error) {
        console.error('Error fetching doctors:', error);
        res.status(500).json({ error: 'Failed to fetch doctors' });
    }
};

export const getDoctorById = async (req: Request, res: Response) => {
    try {
        let { id } = req.params;

        // Resolve doctor by either ObjectId or Firebase UID (userId)
        let doctor;
        if (mongoose.Types.ObjectId.isValid(id)) {
            doctor = await Doctor.findById(id).populate('userId', 'name email');
        } else {
            // Find user first
            const user = await User.findOne({ firebaseUid: id });
            if (user) {
                doctor = await Doctor.findOne({ userId: user._id }).populate('userId', 'name email');
            }
        }

        if (!doctor) {
            return res.status(404).json({ error: 'Doctor not found' });
        }
        res.json(doctor);
    } catch (error) {
        console.error('Error fetching doctor:', error);
        res.status(500).json({ error: 'Failed to fetch doctor' });
    }
};

// Helper to seed or create doctors for testing
export const createDoctor = async (req: Request, res: Response) => {
    try {
        const { name, email, specialization, qualifications, hospitalName, experience, availability } = req.body;

        // 1. Create User
        let user = await User.findOne({ email });
        if (!user) {
            user = await User.create({
                name,
                email,
                role: 'doctor'
            });
        }

        // 2. Create Doctor Profile
        const doctor = await Doctor.create({
            userId: user._id,
            specialization,
            qualifications,
            hospitalName,
            experience,
            availability
        });

        res.status(201).json(doctor);
    } catch (error) {
        console.error('Error creating doctor:', error);
        res.status(500).json({ error: 'Failed to create doctor' });
    }
};

// Complete/Update doctor profile
export const completeProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;
        const { specialization, qualifications, hospitalName, experience, availability, phone } = req.body;

        if (!specialization || !qualifications || !hospitalName || !experience || !availability) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Update user contact number if provided
        if (phone) {
            await User.findByIdAndUpdate(userId, { contactNumber: phone });
        }

        let doctor = await Doctor.findOne({ userId });

        if (doctor) {
            // Update existing profile
            doctor.specialization = specialization;
            doctor.qualifications = qualifications;
            doctor.hospitalName = hospitalName;
            doctor.experience = experience;
            doctor.availability = availability;
            await doctor.save();
        } else {
            // Create new doctor profile
            doctor = await Doctor.create({
                userId,
                specialization,
                qualifications,
                hospitalName,
                experience,
                availability
            });
        }

        res.status(200).json(doctor);
    } catch (error) {
        console.error('Error completing doctor profile:', error);
        res.status(500).json({ error: 'Failed to complete doctor profile' });
    }
};
