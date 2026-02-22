import mongoose, { Schema, Document } from 'mongoose';

export interface IFamilyMember extends Document {
    parentId: mongoose.Types.ObjectId; // The primary patient's user id
    name: string;
    relationship: string;
    age: number;
    profileId?: mongoose.Types.ObjectId; // Link to a separate health profile if needed
    createdAt: Date;
    updatedAt: Date;
}

const FamilyMemberSchema: Schema = new Schema({
    parentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    relationship: { type: String, required: true },
    age: { type: Number, required: true },
    profileId: { type: Schema.Types.ObjectId, ref: 'HealthProfile' }
}, {
    timestamps: true
});

export default mongoose.model<IFamilyMember>('FamilyMember', FamilyMemberSchema);
