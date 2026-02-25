import ShiftSwap from '../models/ShiftSwap';
import Doctor from '../models/Doctor';
import mongoose from 'mongoose';
import { resolveDoctorId } from '../utils/resolver';

export const schedulingService = {
    async suggestSwaps(doctorId: string) {
        const resolvedId = await resolveDoctorId(doctorId);
        const doctor = await Doctor.findOne({ userId: resolvedId });
        if (!doctor) throw new Error('Doctor not found');

        // Find colleagues in same specialty with lower workload
        // For simplicity, we'll find any doctor in same specialization who isn't the current doctor
        const colleagues = await Doctor.find({
            specialization: doctor.specialization,
            userId: { $ne: doctor.userId }
        }).limit(5);

        return colleagues;
    },

    async requestSwap(requesterId: string, targetDoctorId: string, shiftDate: Date, notes?: string) {
        const resolvedRequesterId = await resolveDoctorId(requesterId);
        const resolvedTargetId = await resolveDoctorId(targetDoctorId);
        return await ShiftSwap.create({
            requesterId: resolvedRequesterId,
            targetDoctorId: resolvedTargetId,
            shiftDate,
            notes,
            status: 'pending'
        });
    },

    async getUserSwaps(doctorId: string) {
        const resolvedId = await resolveDoctorId(doctorId);
        return await ShiftSwap.find({
            $or: [
                { requesterId: resolvedId },
                { targetDoctorId: resolvedId }
            ]
        }).populate('requesterId targetDoctorId');
    }
};
