import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    password?: string; // Optional because google auth might not have password
    role: 'patient' | 'doctor' | 'admin';
    age?: number;
    gender?: string;
    contactNumber?: string;
    firebaseUid?: string; // Optional Firebase UID for Google sign-in
    pinCode?: string;
    annualIncome?: number;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    role: {
        type: String,
        enum: ['patient', 'doctor', 'admin'],
        default: 'patient'
    },
    age: { type: Number },
    gender: { type: String },
    contactNumber: { type: String },
    firebaseUid: { type: String },
    pinCode: { type: String },
    annualIncome: { type: Number }
}, {
    timestamps: true
});

export default mongoose.model<IUser>('User', UserSchema);
