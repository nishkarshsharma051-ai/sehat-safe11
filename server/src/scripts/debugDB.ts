import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const PrescriptionSchema = new mongoose.Schema({
    patientId: mongoose.Schema.Types.ObjectId,
    imageUrl: String,
    date: Date
}, { strict: false });

const Prescription = mongoose.model('Prescription', PrescriptionSchema);

const checkDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('Connected to DB');

        const totalP = await Prescription.countDocuments();
        console.log(`Total Prescriptions in DB: ${totalP}`);

        const prescriptions = await Prescription.find().sort({ _id: -1 }).limit(10);
        console.log(`Latest 10 Prescriptions:`);
        prescriptions.forEach(p => {
            console.log(`- ID: ${p._id}, PatientId: ${p.patientId}, Date: ${p.date}`);
        });

        const targetId = '6999c84dd26338fb221cb8bf';
        const targetPrescriptions = await Prescription.find({
            $or: [
                { patientId: new mongoose.Types.ObjectId(targetId) },
                { patientId: targetId }
            ]
        });
        console.log(`\nPrescriptions for ${targetId}: ${targetPrescriptions.length}`);
        targetPrescriptions.forEach(p => {
            console.log(`- ID: ${p._id}, PatientId: ${p.patientId}`);
        });

        if (mongoose.connection.db) {
            const usersCount = await mongoose.connection.db.collection('users').countDocuments();
            console.log(`\nTotal Users: ${usersCount}`);

            const targetUser = await mongoose.connection.db.collection('users').findOne({
                $or: [
                    { _id: new mongoose.Types.ObjectId(targetId) },
                    { firebaseUid: targetId }
                ]
            });
            console.log(`Target User Info:`, targetUser ? { _id: targetUser._id, firebaseUid: targetUser.firebaseUid, name: targetUser.name } : 'Not Found');
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

checkDB();
