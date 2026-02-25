import mongoose, { Schema, Document } from 'mongoose';

export interface IDoctor extends Document {
    userId: mongoose.Types.ObjectId;
    specialization: string;
    qualifications: string;
    hospitalName: string;
    experience: number;
    rating: number;
    availability: string;
    weeklyHoursLimit: number; // Added for burnout tracking
    currentWorkloadAcuity: number; // 1-5 scale
    createdAt: Date;
    updatedAt: Date;
}

const DoctorSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    specialization: { type: String, required: true },
    qualifications: { type: String, required: true },
    hospitalName: { type: String, required: true },
    experience: { type: Number, required: true },
    rating: { type: Number, default: 0 },
    availability: { type: String, required: true },
    weeklyHoursLimit: { type: Number, default: 40 },
    currentWorkloadAcuity: { type: Number, default: 1, min: 1, max: 5 }
}, {
    timestamps: true
});

export default mongoose.model<IDoctor>('Doctor', DoctorSchema);
