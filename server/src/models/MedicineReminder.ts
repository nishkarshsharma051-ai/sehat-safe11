import mongoose, { Schema, Document } from 'mongoose';

export interface IMedicineReminder extends Document {
    patientId: mongoose.Types.ObjectId;
    medicineName: string;
    dosage: string;
    reminderTimes: string[]; // e.g., ["08:00", "20:00"]
    frequency: string;
    isActive: boolean;
    takenHistory: Array<{
        timestamp: Date;
        taken: boolean;
    }>;
    createdAt: Date;
    updatedAt: Date;
}

const MedicineReminderSchema: Schema = new Schema({
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    medicineName: { type: String, required: true },
    dosage: { type: String, required: true },
    reminderTimes: { type: [String], required: true },
    frequency: { type: String, default: 'daily' },
    isActive: { type: Boolean, default: true },
    takenHistory: [{
        timestamp: { type: Date, default: Date.now },
        taken: { type: Boolean, default: true }
    }]
}, {
    timestamps: true
});

export default mongoose.model<IMedicineReminder>('MedicineReminder', MedicineReminderSchema);
