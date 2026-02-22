import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import Appointment from '../models/Appointment';
import Prescription from '../models/Prescription';
import MedicineReminder from '../models/MedicineReminder';
import HospitalFavorite from '../models/HospitalFavorite';
import HealthProfile from '../models/HealthProfile';
import HealthEntry from '../models/HealthEntry';
import InsuranceRecord from '../models/InsuranceRecord';
import FamilyMember from '../models/FamilyMember';

dotenv.config();

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sehat-safe';

const resolveId = async (input: any) => {
    if (!input) return null;
    if (mongoose.Types.ObjectId.isValid(input)) return input;

    // It's likely a firebaseUid
    const user = await User.findOne({ firebaseUid: String(input) });
    if (user) {
        console.log(`  [RESOLVE] Resolved ${input} -> ${user._id}`);
        return user._id;
    }
    return null;
};

const fixCollection = async (Model: any, idField: string) => {
    console.log(`\nChecking ${Model.modelName} (field: ${idField})...`);
    const docs = await Model.find({});
    let fixedCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    for (const doc of docs) {
        const currentId = doc[idField];
        if (!currentId) {
            skippedCount++;
            continue;
        }

        if (!mongoose.Types.ObjectId.isValid(currentId)) {
            const resolvedId = await resolveId(currentId);
            if (resolvedId) {
                doc[idField] = resolvedId;
                await doc.save();
                fixedCount++;
            } else {
                console.warn(`  [FAILED] Could not resolve ID ${currentId} for doc ${doc._id}`);
                failedCount++;
            }
        }
    }
    console.log(`Done ${Model.modelName}: Fixed ${fixedCount}, Failed ${failedCount}, Skipped ${skippedCount}, Total ${docs.length}`);
};

const run = async () => {
    try {
        console.log('Loading .env...');
        if (!process.env.MONGODB_URI) {
            console.error('ERROR: MONGODB_URI not found in environment!');
            process.exit(1);
        }
        console.log(`Connecting to: ${process.env.MONGODB_URI.split('@')[1] || 'Local DB'}`);

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const collections = await mongoose.connection.db!.listCollections().toArray();
        console.log('Available collections:', collections.map(c => c.name));

        await fixCollection(Appointment, 'patientId');
        await fixCollection(Appointment, 'doctorId');
        await fixCollection(Prescription, 'patientId');
        await fixCollection(Prescription, 'doctorId');
        await fixCollection(MedicineReminder, 'patientId');
        await fixCollection(HospitalFavorite, 'patientId');
        await fixCollection(HealthProfile, 'patientId');
        await fixCollection(HealthEntry, 'patientId');
        await fixCollection(InsuranceRecord, 'patientId');
        await fixCollection(FamilyMember, 'parentId');

        console.log('\nData cleanup finished successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Data cleanup failed:', error);
        process.exit(1);
    }
};

run();
