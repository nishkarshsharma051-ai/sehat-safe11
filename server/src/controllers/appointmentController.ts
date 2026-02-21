import mongoose from 'mongoose';
import { Request, Response } from 'express';
import Appointment from '../models/Appointment';
import User from '../models/User';

export const getAppointments = async (req: Request, res: Response) => {
    try {
        const { userId, role } = req.query;
        let query = {};

        if (role === 'patient' && userId) {
            // Check if userId is a valid ObjectId, if not, it's likely a Firebase UID
            if (mongoose.Types.ObjectId.isValid(userId as string)) {
                query = { patientId: userId };
            } else {
                // Find user by firebaseUid
                const user = await User.findOne({ firebaseUid: userId });
                if (user) {
                    query = { patientId: user._id };
                } else {
                    return res.json({ appointments: [] }); // User not found in DB yet
                }
            }
        } else if (role === 'doctor' && userId) {
            if (mongoose.Types.ObjectId.isValid(userId as string)) {
                query = { doctorId: userId };
            } else {
                const user = await User.findOne({ firebaseUid: userId });
                if (user) {
                    query = { doctorId: user._id };
                } else {
                    return res.json({ appointments: [] });
                }
            }
        }

        const appointments = await Appointment.find(query)
            .populate('patientId', 'name')
            .populate('doctorId', 'name')
            .sort({ date: 1 });

        res.json({ appointments });
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({ error: 'Failed to fetch appointments' });
    }
};

export const createAppointment = async (req: Request, res: Response) => {
    try {
        let { patientId, doctorId, date, time, reason } = req.body;

        // Resolve patientId if it's a firebaseUid
        if (!mongoose.Types.ObjectId.isValid(patientId)) {
            const pUser = await User.findOne({ firebaseUid: patientId });
            if (pUser) patientId = pUser._id;
            else return res.status(404).json({ error: 'Patient not found' });
        }

        // Resolve doctorId if it's a firebaseUid
        if (!mongoose.Types.ObjectId.isValid(doctorId)) {
            const dUser = await User.findOne({ firebaseUid: doctorId });
            if (dUser) doctorId = dUser._id;
            else return res.status(404).json({ error: 'Doctor not found' });
        }

        const appointment = await Appointment.create({
            patientId,
            doctorId,
            date,
            time,
            reason,
            status: 'pending'
        });

        res.status(201).json(appointment);
    } catch (error) {
        console.error('Error creating appointment:', error);
        res.status(500).json({ error: 'Failed to create appointment' });
    }
};

export const updateAppointmentStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status, notes, rating } = req.body;

        const appointment = await Appointment.findByIdAndUpdate(
            id,
            { status, notes, rating },
            { new: true }
        );

        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        res.json(appointment);
    } catch (error) {
        console.error('Error updating appointment:', error);
        res.status(500).json({ error: 'Failed to update appointment' });
    }
};
export const bulkUpdateStatus = async (req: Request, res: Response) => {
    try {
        const { ids, status } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'Invalid or empty IDs array' });
        }

        const result = await Appointment.updateMany(
            { _id: { $in: ids } },
            { status }
        );

        res.json({
            message: `Successfully updated ${result.modifiedCount} appointments`,
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error('Error bulk updating appointments:', error);
        res.status(500).json({ error: 'Failed to bulk update appointments' });
    }
};
