import mongoose, { Schema, Document } from 'mongoose';

export interface IShiftSwap extends Document {
    requesterId: mongoose.Types.ObjectId;
    targetDoctorId: mongoose.Types.ObjectId;
    shiftDate: Date;
    status: 'pending' | 'approved' | 'rejected';
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ShiftSwapSchema: Schema = new Schema({
    requesterId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    targetDoctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    shiftDate: { type: Date, required: true },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    notes: { type: String }
}, {
    timestamps: true
});

export default mongoose.model<IShiftSwap>('ShiftSwap', ShiftSwapSchema);
