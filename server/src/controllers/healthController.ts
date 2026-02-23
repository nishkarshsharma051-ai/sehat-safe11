import { Request, Response } from 'express';
import mongoose from 'mongoose';
import HealthProfile from '../models/HealthProfile';
import HealthEntry from '../models/HealthEntry';
import User from '../models/User';
import { createWorker } from "tesseract.js";
import pdfParse from 'pdf-parse';
import fs from 'fs';
import path from 'path';
import { preprocessImage } from "../utils/imageProcessor";
import { geminiService } from "../services/geminiService";

const resolvePatientId = async (input: string) => {
    if (mongoose.Types.ObjectId.isValid(input)) return input;
    const user = await User.findOne({ firebaseUid: input });
    return user ? user._id : null;
};

// ─── Health Profile ──────────────────────────────────
export const getHealthProfile = async (req: Request, res: Response) => {
    try {
        const { patientId } = req.query;
        if (!patientId) return res.status(400).json({ error: 'patientId is required' });

        const resolvedId = await resolvePatientId(patientId as string);
        if (!resolvedId) return res.status(404).json({ error: 'User not found' });

        const profile = await HealthProfile.findOne({ patientId: resolvedId });
        res.json(profile);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const saveHealthProfile = async (req: Request, res: Response) => {
    try {
        const { patientId, ...profileData } = req.body;
        const resolvedId = await resolvePatientId(patientId);
        if (!resolvedId) return res.status(404).json({ error: 'User not found' });

        const profile = await HealthProfile.findOneAndUpdate(
            { patientId: resolvedId },
            { ...profileData, patientId: resolvedId },
            { upsert: true, new: true }
        );

        res.json(profile);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

// ─── Health Entries ──────────────────────────────────
export const getHealthEntries = async (req: Request, res: Response) => {
    try {
        const { patientId, type } = req.query;
        if (!patientId) return res.status(400).json({ error: 'patientId is required' });

        const resolvedId = await resolvePatientId(patientId as string);
        if (!resolvedId) return res.json([]);

        let query: any = { patientId: resolvedId };
        if (type) query.type = type;

        const entries = await HealthEntry.find(query).sort({ date: -1 });
        res.json(entries);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const addHealthEntry = async (req: Request, res: Response) => {
    try {
        const { patientId, date, type, title, description, values } = req.body;
        const resolvedId = await resolvePatientId(patientId);
        if (!resolvedId) return res.status(404).json({ error: 'User not found' });

        const entry = await HealthEntry.create({
            patientId: resolvedId,
            date,
            type,
            title,
            description,
            values
        });

        res.status(201).json(entry);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const removeHealthEntry = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await HealthEntry.findByIdAndDelete(id);
        res.json({ message: 'Entry removed' });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const uploadRecord = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image or PDF file provided' });
        }

        let resolvedPatientId = req.body.patientId;
        if (!resolvedPatientId) {
            return res.status(400).json({ error: 'patientId required' });
        }
        resolvedPatientId = await resolvePatientId(resolvedPatientId);
        if (!resolvedPatientId) return res.status(404).json({ error: 'User not found' });

        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExt = path.extname(req.file.originalname);
        const filename = `${uniqueSuffix}${fileExt}`;
        const uploadPath = path.join(__dirname, '../../uploads', filename);

        // Ensure uploads directory exists
        const uploadsDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        await fs.promises.writeFile(uploadPath, req.file.buffer);

        let extractedText = '';

        if (req.file.mimetype === 'application/pdf') {
            try {
                const pdfData = await (pdfParse as unknown as (b: Buffer) => Promise<{ text: string }>)(req.file.buffer);
                extractedText = pdfData.text;
            } catch (e) {
                return res.status(500).json({ error: "Failed to parse PDF." });
            }
        } else {
            try {
                const processedBuffer = await preprocessImage(req.file.buffer);
                const worker = await createWorker('eng', 1);
                await worker.setParameters({
                    tessedit_pageseg_mode: '1',
                } as Record<string, string>);

                const ret = await worker.recognize(processedBuffer);
                await worker.terminate();
                extractedText = ret.data.text;
            } catch (e) {
                return res.status(500).json({ error: "OCR Failed." });
            }
        }

        // Call Gemini/Groq for structured extraction
        const recordData = await geminiService.extractMedicalRecord(extractedText);

        // Ensure type falls within schema enum
        const validTypes = ['test', 'prescription', 'surgery', 'report', 'vitals'];
        const recordType = validTypes.includes(recordData.type) ? recordData.type : 'report';

        // Save to HealthEntry
        const entry = await HealthEntry.create({
            patientId: resolvedPatientId,
            date: recordData.date || new Date().toISOString(),
            type: recordType,
            title: recordData.title || 'Uploaded Record',
            description: recordData.description || 'Medical record extraction.',
            values: recordData.values
        });

        res.status(201).json({ entry, extractedText, recordData });

    } catch (error) {
        console.error('[UploadRecord] Error:', error);
        res.status(500).json({ error: (error as Error).message });
    }
};
