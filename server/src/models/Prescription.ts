import mongoose, { Schema, Document } from 'mongoose';

export interface IPrescription extends Document {
    patientId: mongoose.Types.ObjectId;
    doctorId?: mongoose.Types.ObjectId; // Optional if uploaded by patient directly
    imageUrl?: string;
    extractedText?: string;
    medicines: Array<{
        name: string;
        dosage: string;
        frequency: string;
        duration: string;
    }>;
    analysis?: string; // AI Analysis
    date: Date;
    createdAt: Date;
    updatedAt: Date;
}

const PrescriptionSchema: Schema = new Schema({
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'User' },
    imageUrl: { type: String },
    extractedText: { type: String },
    medicines: [{
        name: String,
        dosage: String,
        frequency: String,
        duration: String
    }],
    analysis: { type: String },
    date: { type: Date, default: Date.now }
}, {
    timestamps: true
});

export default mongoose.model<IPrescription>('Prescription', PrescriptionSchema);
