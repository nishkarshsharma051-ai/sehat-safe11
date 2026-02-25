import dotenv from 'dotenv';
import { connectDB } from '../config/db';
import User from '../models/User';
import mongoose from 'mongoose';

dotenv.config();

const seedAdmin = async () => {
    try {
        await connectDB();

        const adminEmail = 'admin@sehatsafe.com';
        const plainPassword = 'admin';

        const existingAdmin = await User.findOne({ email: adminEmail });

        if (existingAdmin) {
            console.log('Admin user already exists');
        } else {
            await User.create({
                name: 'Admin User',
                email: adminEmail,
                password: plainPassword, // Model hashes this
                role: 'admin',
                age: 30,
                gender: 'Other',
                contactNumber: '0000000000'
            });
            console.log('Admin user created successfully');
            console.log(`Email: ${adminEmail}`);
        }

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();
