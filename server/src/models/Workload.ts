import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkload extends Document {
    doctorId: mongoose.Types.ObjectId;
    census: number; // Total patients assigned
    averageAcuity: number; // 1-5
    estimatedHours: number;
    date: Date;
    createdAt: Date;
    updatedAt: Date;
}

const WorkloadSchema: Schema = new Schema({
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    census: { type: Number, default: 0 },
    averageAcuity: { type: Number, default: 1, min: 1, max: 5 },
    estimatedHours: { type: Number, default: 0 },
    date: { type: Date, default: Date.now }
}, {
    timestamps: true
});

export default mongoose.model<IWorkload>('Workload', WorkloadSchema);
