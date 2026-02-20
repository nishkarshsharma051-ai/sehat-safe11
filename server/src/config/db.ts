import mongoose from 'mongoose';

export const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sehat-safe';

        await mongoose.connect(mongoURI);

        console.log('MongoDB Connected Successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        // process.exit(1); // Don't crash server on DB fail
    }
};
