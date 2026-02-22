import mongoose, { Schema, Document } from 'mongoose';

export interface IHospitalFavorite extends Document {
    patientId: mongoose.Types.ObjectId;
    name: string;
    address: string;
    phone: string;
    type: string;
    lat: number;
    lng: number;
    createdAt: Date;
    updatedAt: Date;
}

const HospitalFavoriteSchema: Schema = new Schema({
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String },
    type: { type: String, default: 'hospital' },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
}, {
    timestamps: true
});

// Avoid duplicate favorites for the same patient
HospitalFavoriteSchema.index({ patientId: 1, name: 1 }, { unique: true });

export default mongoose.model<IHospitalFavorite>('HospitalFavorite', HospitalFavoriteSchema);
