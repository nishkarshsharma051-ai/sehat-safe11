import mongoose from 'mongoose';
import User from '../models/User';
import Doctor from '../models/Doctor';

export const resolveDoctorId = async (id: string) => {
    if (mongoose.Types.ObjectId.isValid(id)) {
        return new mongoose.Types.ObjectId(id);
    }
    const user = await User.findOne({ firebaseUid: id });
    if (!user) throw new Error('User not found for provided ID');
    const doctor = await Doctor.findOne({ userId: user._id });
    if (!doctor) throw new Error('Doctor profile not found');
    return doctor.userId;
};
