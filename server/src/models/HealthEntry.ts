import mongoose, { Schema, Document } from 'mongoose';

export interface IHealthEntry extends Document {
    patientId: mongoose.Types.ObjectId;
    date: Date;
    type: 'test' | 'prescription' | 'surgery' | 'report' | 'vitals';
    title: string;
    description: string;
    values?: Record<string, number>;
    createdAt: Date;
    updatedAt: Date;
}

const HealthEntrySchema: Schema = new Schema({
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    type: { type: String, enum: ['test', 'prescription', 'surgery', 'report', 'vitals'], required: true },
    title: { type: String, required: true },
    description: { type: String },
    values: { type: Map, of: Number }
}, {
    timestamps: true
});

export default mongoose.model<IHealthEntry>('HealthEntry', HealthEntrySchema);
