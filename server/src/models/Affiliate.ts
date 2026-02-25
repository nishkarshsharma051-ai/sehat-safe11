import mongoose, { Schema, Document } from 'mongoose';

export interface IAffiliate extends Document {
    name: string;
    type: 'hospital' | 'lab' | 'clinic';
    address: string;
    phone: string;
    email?: string;
    website?: string;
    location?: {
        type: string;
        coordinates: number[];
    };
    services: string[];
    rating: number;
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const AffiliateSchema: Schema = new Schema({
    name: { type: String, required: true },
    type: { type: String, enum: ['hospital', 'lab', 'clinic'], required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    website: { type: String },
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true } // [lng, lat]
    },
    services: [{ type: String }],
    rating: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false }
}, {
    timestamps: true
});

AffiliateSchema.index({ location: '2dsphere' });

export default mongoose.model<IAffiliate>('Affiliate', AffiliateSchema);
