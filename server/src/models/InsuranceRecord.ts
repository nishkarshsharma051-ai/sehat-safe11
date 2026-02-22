import mongoose, { Schema, Document } from 'mongoose';

export interface IInsuranceRecord extends Document {
    patientId: mongoose.Types.ObjectId;
    provider: string;
    policyNumber: string;
    coverageType: string;
    expiryDate: Date;
    premium?: number;
    claims: Array<{
        date: Date;
        amount: number;
        status: 'pending' | 'approved' | 'rejected';
        description: string;
    }>;
    createdAt: Date;
    updatedAt: Date;
}

const InsuranceRecordSchema: Schema = new Schema({
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    provider: { type: String, required: true },
    policyNumber: { type: String, required: true },
    coverageType: { type: String, required: true },
    expiryDate: { type: Date, required: true },
    premium: { type: Number },
    claims: [{
        date: { type: Date, default: Date.now },
        amount: Number,
        status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
        description: String
    }]
}, {
    timestamps: true
});

export default mongoose.model<IInsuranceRecord>('InsuranceRecord', InsuranceRecordSchema);
