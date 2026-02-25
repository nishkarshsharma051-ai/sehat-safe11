import mongoose, { Schema, Document } from 'mongoose';

export interface ISymptomLog extends Document {
    patientId: mongoose.Types.ObjectId;
    date: Date;
    symptoms: Array<{
        name: string;
        severity: number;
        notes?: string;
    }>;
    createdAt: Date;
    updatedAt: Date;
}

const SymptomLogSchema: Schema = new Schema({
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, default: Date.now },
    symptoms: [{
        name: { type: String, required: true },
        severity: { type: Number, min: 1, max: 10, required: true },
        notes: { type: String }
    }]
}, {
    timestamps: true
});

export default mongoose.model<ISymptomLog>('SymptomLog', SymptomLogSchema);
