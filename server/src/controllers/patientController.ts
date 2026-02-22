import mongoose from 'mongoose';
import { Request, Response } from 'express';
import User from '../models/User';
import Appointment from '../models/Appointment';

// Get all patients (for admin or search)
export const getPatients = async (req: Request, res: Response) => {
    try {
        const patients = await User.find({ role: 'patient' }).select('-password');
        res.json(patients);
    } catch (error) {
        console.error('Error fetching patients:', error);
        res.status(500).json({ error: 'Failed to fetch patients' });
    }
};

// Get patients associated with a specific doctor (via appointments)
// This is "My Patients"
export const getDoctorPatients = async (req: Request, res: Response) => {
    try {
        let { doctorId } = req.params;

        // Resolve doctorId if it's a firebaseUid
        if (!mongoose.Types.ObjectId.isValid(doctorId)) {
            const dUser = await User.findOne({ firebaseUid: doctorId });
            if (dUser) doctorId = (dUser._id as unknown as string).toString();
            else return res.json([]); // Doctor profile not found
        }

        // Find all appointments for this doctor
        const appointments = await Appointment.find({ doctorId });

        // Extract unique patient IDs
        const patientIds = [...new Set(appointments.map(apt => apt.patientId.toString()))];

        // Fetch user details for these patients
        const patients = await User.find({ _id: { $in: patientIds } }).select('-password');

        res.json(patients);
    } catch (error) {
        console.error('Error fetching doctor patients:', error);
        res.status(500).json({ error: 'Failed to fetch doctor patients' });
    }
};

// Create a manual patient entry
export const createManualPatient = async (req: Request, res: Response) => {
    try {
        const { full_name, phone, gender, age } = req.body;

        if (!full_name || !phone) {
            return res.status(400).json({ error: 'Name and phone are required' });
        }

        // Check if patient already exists by phone
        let patient = await User.findOne({ contactNumber: phone });

        if (!patient) {
            // Create new patient with a virtual email
            const virtualEmail = `manual_${phone}@sehatsafe.com`;
            patient = new User({
                name: full_name,
                email: virtualEmail,
                contactNumber: phone,
                gender,
                age,
                role: 'patient'
            });
            await patient.save();
        }

        res.status(201).json({
            id: patient._id,
            role: patient.role,
            full_name: patient.name,
            email: patient.email,
            phone: patient.contactNumber,
            gender: patient.gender,
            age: patient.age,
            created_at: patient.createdAt
        });
    } catch (error) {
        console.error('Error creating manual patient:', error);
        res.status(500).json({ error: 'Failed to create manual patient' });
    }
};
