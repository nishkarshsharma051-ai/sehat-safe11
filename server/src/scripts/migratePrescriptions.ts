import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import User from '../models/User';
import Prescription from '../models/Prescription';

const migrate = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sehat-safe';
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const prescriptions = await Prescription.find({});
        console.log(`Found ${prescriptions.length} prescriptions`);

        for (const p of prescriptions) {
            let updated = false;

            // Fix patientId
            const pIdStr = p.patientId.toString();
            if (!mongoose.Types.ObjectId.isValid(pIdStr) || pIdStr.length > 24) {
                console.log(`Fixing patientId for prescription ${p._id}: ${pIdStr}`);
                const user = await User.findOne({ firebaseUid: pIdStr });
                if (user) {
                    p.patientId = user._id;
                    updated = true;
                    console.log(`  -> Resolved to MongoDB _id: ${user._id}`);
                } else {
                    console.warn(`  !! Could not find user with firebaseUid: ${pIdStr}`);
                }
            }

            // Fix doctorId
            if (p.doctorId) {
                const dIdStr = p.doctorId.toString();
                if (!mongoose.Types.ObjectId.isValid(dIdStr) || dIdStr.length > 24) {
                    console.log(`Fixing doctorId for prescription ${p._id}: ${dIdStr}`);
                    const doc = await User.findOne({ firebaseUid: dIdStr });
                    if (doc) {
                        p.doctorId = doc._id;
                        updated = true;
                        console.log(`  -> Resolved to MongoDB _id: ${doc._id}`);
                    } else {
                        console.warn(`  !! Could not find doctor with firebaseUid: ${dIdStr}`);
                    }
                }
            }

            if (updated) {
                await p.save();
                console.log(`Prescription ${p._id} updated successfully`);
            }
        }

        console.log('Migration complete');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.disconnect();
    }
};

migrate();
