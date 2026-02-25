import { Request, Response } from 'express';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const generateToken = (id: any, role: string) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET as string, {
        expiresIn: '30d',
    });
};

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, name, role, firebaseUid } = req.body;

        let user = await User.findOne({ email });

        if (user) {
            return res.json({
                user: { id: user._id, name: user.name, email: user.email, role: user.role },
                message: "User exists."
            });
        }

        user = new User({
            email,
            password, // Model pre-save hook will hash this
            name,
            role: role || 'patient',
            firebaseUid
        });

        await user.save();

        res.status(201).json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            token: generateToken(user._id, user.role)
        });

    } catch (error) {
        console.error('Registration error:', (error as Error).message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!user.password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await (user as any).comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Return user info (excluding password)
        const userResponse = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        };

        res.json({
            user: userResponse,
            token: generateToken(user._id, user.role)
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const verifyUser = async (req: Request, res: Response) => {
    try {
        const { email, firebaseUid } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // verifyUID if provided to prevent unauthorized token generation
        if (firebaseUid && user.firebaseUid && firebaseUid !== user.firebaseUid) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const userResponse = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        };

        res.json({
            user: userResponse,
            token: generateToken(user._id, user.role)
        });
    } catch (error) {
        console.error('Verify user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
