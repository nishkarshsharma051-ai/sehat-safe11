import mongoose, { Schema, Document } from 'mongoose';

export interface IDoctor extends Document {
    userId: mongoose.Types.ObjectId;
    specialization: string;
    hospitalName: string;
    experience: number;
    rating: number;
    availability: string; // Could be more complex object in future
    createdAt: Date;
    updatedAt: Date;
}

const DoctorSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    specialization: { type: String, required: true },
    hospitalName: { type: String, required: true },
    experience: { type: Number, required: true },
    rating: { type: Number, default: 0 },
    availability: { type: String, required: true }
}, {
    timestamps: true
});

export default mongoose.model<IDoctor>('Doctor', DoctorSchema);
