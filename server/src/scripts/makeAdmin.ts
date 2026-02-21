import dotenv from 'dotenv';
import { connectDB } from '../config/db';
import User from '../models/User';
import mongoose from 'mongoose';

dotenv.config();

const makeAdmin = async () => {
    try {
        await connectDB();

        const email = process.argv[2];

        if (!email) {
            console.error('Please provide an email address');
            process.exit(1);
        }

        const user = await User.findOne({ email });

        if (!user) {
            console.error(`User with email ${email} not found`);
            // Optionally, we could create the user here if we wanted to auto-provision
            // But for now, let's assume they signed up via Firebase/Frontend
            console.log('Creating admin user...');
            // We won't set a password hash for now as they will likely use Firebase/Google Auth
            // But if we validated password, we'd need it. 
            // Since verifyUser doesn't check password (just email), we can just create the record.
            await User.create({
                name: 'Admin User',
                email: email,
                role: 'admin',
                // Dummy values for required fields if any, schema says name/email required
            });
            console.log(`User ${email} created as Admin.`);
        } else {
            user.role = 'admin';
            await user.save();
            console.log(`User ${email} has been promoted to Admin`);
        }

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Error promoting user:', error);
        process.exit(1);
    }
};

makeAdmin();
