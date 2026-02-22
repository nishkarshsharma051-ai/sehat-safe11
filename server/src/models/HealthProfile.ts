import mongoose, { Schema, Document } from 'mongoose';

export interface IHealthProfile extends Document {
    patientId: mongoose.Types.ObjectId;
    age?: number;
    weight?: number;
    height?: number;
    bloodGroup?: string;
    bpSystolic?: number;
    bpDiastolic?: number;
    sugarLevel?: number;
    allergies: string[];
    chronicConditions: string[];
    emergencyContacts: Array<{
        name: string;
        phone: string;
        relationship: string;
    }>;
    createdAt: Date;
    updatedAt: Date;
}

const HealthProfileSchema: Schema = new Schema({
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    age: { type: Number },
    weight: { type: Number },
    height: { type: Number },
    bloodGroup: { type: String },
    bpSystolic: { type: Number },
    bpDiastolic: { type: Number },
    sugarLevel: { type: Number },
    allergies: { type: [String], default: [] },
    chronicConditions: { type: [String], default: [] },
    emergencyContacts: [{
        name: String,
        phone: String,
        relationship: String
    }]
}, {
    timestamps: true
});

export default mongoose.model<IHealthProfile>('HealthProfile', HealthProfileSchema);
