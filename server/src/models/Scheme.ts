import mongoose, { Schema, Document } from 'mongoose';

export interface IScheme extends Document {
    name: string;
    description: string;
    eligibility: {
        minAge?: number;
        maxAge?: number;
        incomeLimit?: number;
        gender?: 'male' | 'female' | 'other' | 'all';
        chronicConditions?: string[];
        states?: string[];
    };
    benefits: string[];
    applyLink: string;
    category: 'central' | 'state';
    createdAt: Date;
    updatedAt: Date;
}

const SchemeSchema: Schema = new Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    eligibility: {
        minAge: { type: Number, default: 0 },
        maxAge: { type: Number, default: 120 },
        incomeLimit: { type: Number },
        gender: { type: String, enum: ['male', 'female', 'other', 'all'], default: 'all' },
        chronicConditions: { type: [String], default: [] },
        states: { type: [String], default: [] }
    },
    benefits: { type: [String], default: [] },
    applyLink: { type: String },
    category: { type: String, enum: ['central', 'state'], default: 'central' }
}, {
    timestamps: true
});

export default mongoose.model<IScheme>('Scheme', SchemeSchema);
