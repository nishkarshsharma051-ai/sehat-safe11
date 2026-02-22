import { Request, Response } from 'express';
import User from '../models/User';
import Appointment from '../models/Appointment';
import Prescription from '../models/Prescription';

export const getStats = async (req: Request, res: Response) => {
    try {
        const [userCount, patientCount, doctorCount, appointmentCount, prescriptionCount] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: 'patient' }),
            User.countDocuments({ role: 'doctor' }),
            Appointment.countDocuments(),
            Prescription.countDocuments()
        ]);

        const pendingAppointments = await Appointment.countDocuments({ status: 'pending' });

        res.json({
            totalUsers: userCount,
            patients: patientCount,
            doctors: doctorCount,
            totalAppointments: appointmentCount,
            totalPrescriptions: prescriptionCount,
            pendingAppointments
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({ error: 'Failed to fetch admin stats' });
    }
};

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        console.error('Error fetching all users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

export const getAllAppointments = async (req: Request, res: Response) => {
    try {
        const appointments = await Appointment.find()
            .populate('patientId', 'name email')
            .populate({
                path: 'doctorId',
                model: 'User',
                select: 'name email'
            })
            .sort({ appointment_date: -1 });

        // Transform to match frontend expectations
        const formatted = appointments.map(apt => ({
            id: apt._id,
            patient_id: apt.patientId?._id,
            patient: { full_name: (apt.patientId as any)?.name },
            doctor_id: apt.doctorId?._id,
            doctor: { full_name: (apt.doctorId as any)?.name },
            appointment_date: apt.date,
            time: apt.time,
            status: apt.status,
            reason: apt.reason
        }));

        res.json(formatted);
    } catch (error) {
        console.error('Error fetching all appointments:', error);
        res.status(500).json({ error: 'Failed to fetch appointments' });
    }
};

export const getAllPrescriptions = async (req: Request, res: Response) => {
    try {
        const prescriptions = await Prescription.find()
            .populate('patientId', 'name email')
            .populate({
                path: 'doctorId',
                model: 'User',
                select: 'name'
            })
            .sort({ createdAt: -1 });

        res.json(prescriptions.map(p => ({
            id: p._id,
            patient_id: p.patientId?._id,
            patient: { full_name: (p.patientId as any)?.name },
            doctor_id: p.doctorId?._id,
            doctor_name: (p.doctorId as any)?.name,
            diagnosis: p.analysis, // Using analysis as diagnosis placeholder
            medicines: p.medicines,
            file_url: p.pdfUrl || p.imageUrl,
            created_at: p.createdAt
        })));
    } catch (error) {
        console.error('Error fetching all prescriptions:', error);
        res.status(500).json({ error: 'Failed to fetch prescriptions' });
    }
};
