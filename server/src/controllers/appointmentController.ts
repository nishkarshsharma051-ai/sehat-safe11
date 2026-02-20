import { Request, Response } from 'express';
import Appointment from '../models/Appointment';
import User from '../models/User';
import Doctor from '../models/Doctor';

export const getAppointments = async (req: Request, res: Response) => {
    try {
        const { userId, role } = req.query;
        let query = {};

        if (role === 'patient' && userId) {
            query = { patientId: userId };
        } else if (role === 'doctor' && userId) {
            // Since Appointment now references User for doctorId, we can query directly
            query = { doctorId: userId };
        }

        const appointments = await Appointment.find(query)
            .populate('patientId', 'name')
            .populate('doctorId') // Expand doctor details if needed
            .sort({ date: 1 });

        res.json({ appointments });
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({ error: 'Failed to fetch appointments' });
    }
};

export const createAppointment = async (req: Request, res: Response) => {
    try {
        const { patientId, doctorId, date, time, reason } = req.body;

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
