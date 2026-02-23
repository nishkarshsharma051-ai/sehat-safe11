import mongoose, { Schema, Document } from 'mongoose';

export interface IPatientActivePlan extends Document {
    patientId: string; // Firebase UID
    planId: string;
    planName: string;
    category: string;
    status: 'active' | 'completed';
    completedActivities: string[]; // Array of activity IDs
    startedAt: Date;
    completedAt?: Date;
}

const PatientActivePlanSchema: Schema = new Schema({
    patientId: { type: String, required: true, index: true },
    planId: { type: String, required: true },
    planName: { type: String, required: true },
    category: { type: String, required: true },
    status: { type: String, enum: ['active', 'completed'], default: 'active' },
    completedActivities: { type: [String], default: [] },
    startedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// A patient can only have one active plan at a time for simplicity in this implementation
// We'll handle this in the controller logic.

export default mongoose.model<IPatientActivePlan>('PatientActivePlan', PatientActivePlanSchema);
