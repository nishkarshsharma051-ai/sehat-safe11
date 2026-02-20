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
        const { doctorId } = req.params;

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
