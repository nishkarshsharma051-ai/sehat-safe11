import Workload from '../models/Workload';
import Doctor from '../models/Doctor';
import User from '../models/User';
import Appointment from '../models/Appointment';
import mongoose from 'mongoose';
import { resolveDoctorId } from '../utils/resolver';

export const workloadService = {
    async calculateCurrentWorkload(doctorId: string) {
        // In a real app, this would query active patients in the ward/clinic
        // For this demo, we'll base it on confirmed appointments for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const resolvedId = await resolveDoctorId(doctorId);
        const census = await Appointment.countDocuments({
            doctorId: resolvedId,
            date: { $gte: today, $lt: tomorrow },
            status: 'confirmed'
        });

        // Mock acuity calculation - in real app, this would be based on patient 'acuity' field
        const doctor = await Doctor.findOne({ userId: resolvedId });
        const averageAcuity = doctor?.currentWorkloadAcuity || 1;

        // Estimated hours: census * base_time (e.g. 0.5hr) * acuity_multiplier
        const baseTimePerPatient = 0.5;
        const estimatedHours = census * baseTimePerPatient * (averageAcuity * 0.5 + 0.5);

        const workload = await Workload.create({
            doctorId: resolvedId,
            census,
            averageAcuity,
            estimatedHours,
            date: new Date()
        });

        return workload;
    },

    async predictBurnout(doctorId: string) {
        const resolvedId = await resolveDoctorId(doctorId);
        const doctor = await Doctor.findOne({ userId: resolvedId });
        if (!doctor) throw new Error('Doctor not found');

        // Look at workloads over the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const workloads = await Workload.find({
            doctorId: resolvedId,
            date: { $gte: sevenDaysAgo }
        });

        const totalHoursThisWeek = workloads.reduce((sum, w) => sum + w.estimatedHours, 0);
        const limit = doctor.weeklyHoursLimit || 40;
        const trend = totalHoursThisWeek / limit;

        return {
            totalHoursThisWeek,
            limit,
            trend, // fraction of limit
            isAtRisk: trend > 0.8,
            recommendation: trend > 1.0
                ? "Immediate capacity reduction recommended. Auto-suggesting shift swaps."
                : trend > 0.8
                    ? "Weekly hours trending high. Consider offloading non-critical tasks."
                    : "Workload within healthy limits."
        };
    }
};
