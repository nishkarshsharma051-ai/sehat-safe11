import { Request, Response } from 'express';
import User from '../models/User';

import bcrypt from 'bcryptjs';

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, name, role, firebaseUid } = req.body;

        // Check if user exists
        let user = await User.findOne({ email });

        if (user) {
            // If user exists but role is different, reject? 
            // Or if existing user is trying to "register" again, return existing.
            // But if they are changing roles, we should block it or return existing role.
            if (user.role && role && user.role !== role) {
                return res.json({
                    user: { id: user._id, name: user.name, email: user.email, role: user.role },
                    message: "User exists with a different role. Using existing role.",
                    roleMismatch: true
                });
            }
            return res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
        }

        // Create new user with ROLE locked logic
        // If password provided (local auth), hash it. If firebaseUid (social), store it.
        const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

        user = new User({
            email,
            password: hashedPassword,
            name,
            role: role || 'patient', // Default to patient if not provided, but frontend should provide it
            firebaseUid // Optional, to link with firebase
        });

        await user.save();

        res.status(201).json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
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

        // Use bcrypt to compare the provided password with the hashed password in DB
        const isMatch = await bcrypt.compare(password, user.password || '');

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

        res.json({ user: userResponse });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const verifyUser = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userResponse = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        };

        res.json({ user: userResponse });
    } catch (error) {
        console.error('Verify user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
