import { Request, Response } from "express";
import mongoose from "mongoose";
import { createWorker } from "tesseract.js";
const pdfParse = require('pdf-parse');
import Prescription from "../models/Prescription";
import User from '../models/User';
import fs from 'fs';
import path from 'path';
import { preprocessImage } from "../utils/imageProcessor";
import { MedicalNER } from "../utils/medicalNER";

export const analyzePrescription = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image or PDF file provided' });
        }

        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExt = path.extname(req.file.originalname);
        const filename = `${uniqueSuffix}${fileExt}`;
        const uploadPath = path.join(__dirname, '../../uploads', filename);

        await fs.promises.writeFile(uploadPath, req.file.buffer);
        const fileUrl = `/uploads/${filename}`;

        console.log(`[OCR] Processing: ${req.file.originalname}`);
        const startTime = Date.now();

        let extractedText = '';

        // 1. Image Preprocessing & OCR
        if (req.file.mimetype === 'application/pdf') {
            try {
                const pdfData = await pdfParse(req.file.buffer);
                extractedText = pdfData.text;
                console.log(`[OCR] PDF parsed in ${Date.now() - startTime}ms`);
            } catch (e) {
                console.error("[OCR] PDF Parse Error:", e);
                return res.status(500).json({ error: "Failed to parse PDF." });
            }
        } else {
            try {
                // Preprocess the image buffer
                console.log("[OCR] Preprocessing image...");
                const processedBuffer = await preprocessImage(req.file.buffer);

                console.log("[OCR] Initializing Tesseract...");
                const worker = await createWorker('eng', 1, {
                    logger: m => console.log(`[OCR] ${m.status}: ${Math.round(m.progress * 100)}%`)
                });

                // Set whitelist if possible, or PSM for better line reading
                await worker.setParameters({
                    tessedit_pageseg_mode: '1' as any, // Automatic page segmentation with OSD
                });

                const ret = await worker.recognize(processedBuffer);
                await worker.terminate();
                extractedText = ret.data.text;
                console.log(`[OCR] Image OCR completed in ${Date.now() - startTime}ms`);
            } catch (e) {
                console.error("[OCR] OCR Error:", e);
                return res.status(500).json({ error: "OCR Failed." });
            }
        }

        // 2. Intelligent Parsing with Fuzzy Matching (Local "AI")
        const lines = extractedText.split('\n').map(l => l.trim()).filter(l => l.length > 2);

        const extractedMedicines: any[] = [];
        let doctorName = 'Unknown Doctor';
        let diagnosis = 'Review Required';

        // Patterns
        const doctorPattern = /(?:Dr\.|Doctor|Physician)\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i;
        const diagnosisPattern = /(?:Diagnosis|Dx|Impression)\s*[:\-\.]?\s*([^\n\r]+)/i;

        // Scan lines
        for (const line of lines) {
            // Check for Doctor
            if (!doctorName || doctorName === 'Unknown Doctor') {
                const docMatch = line.match(doctorPattern);
                if (docMatch) doctorName = docMatch[1].trim();
            }

            // Check for Diagnosis
            if (!diagnosis || diagnosis === 'Review Required') {
                const dxMatch = line.match(diagnosisPattern);
                if (dxMatch) diagnosis = dxMatch[1].trim();
            }

            // check for medicines using Fuzzy Logic
            // Split line into words or phrases to check against DB?
            // Simple approach: Check if line contains a known medicine
            // Or better: Check if the line *looks* like a medicine line (has dosage/freq)
            // Then find the best medicine match in that line.

            const hasDosage = /\d+\s*(?:mg|ml|tab)/i.test(line);

            if (hasDosage || line.length < 50) { // Potential medicine line
                // Try to recognize any medicine name in the line
                // We split by space to find potential med words
                const words = line.split(' ');

                // Sliding window or chunk checking could be better, but let's try whole line matching first
                // or checking strictly against words.
                // Let's look for known medicines in the line

                // Simple: Extract the first word that resembles a medicine
                const potentialName = words[0] + (words[1] ? ' ' + words[1] : '');
                const correctedName = MedicalNER.correctMedicineName(potentialName);

                if (correctedName) {
                    extractedMedicines.push({
                        name: correctedName, // The corrected, clean name
                        dosage: MedicalNER.extractDosage(line),
                        frequency: MedicalNER.extractFrequency(line),
                        duration: MedicalNER.extractDuration(line),
                        originalLine: line // Keep reference
                    });
                }
            }
        }

        const analysis = {
            "Doctor Name": doctorName,
            "Diagnosis": diagnosis,
            "Medicines": extractedMedicines,
            "Date": new Date().toLocaleDateString(),
            "Raw Confidence": "Local Custom OCR"
        };

        // 3. Save to MongoDB
        let prescriptionId = null;
        if (mongoose.connection.readyState === 1 && req.body.patientId) {
            try {
                const prescription = await Prescription.create({
                    patientId: req.body.patientId,
                    imageUrl: fileUrl,
                    extractedText,
                    medicines: extractedMedicines,
                    analysis: JSON.stringify(analysis)
                });
                prescriptionId = (prescription as any)._id;
            } catch (dbError) {
                console.warn('[OCR] DB save failed:', dbError);
            }
        }

        res.json({
            extractedText,
            analysis,
            prescriptionId,
            fileUrl,
            success: true
        });

    } catch (error: any) {
        console.error('[OCR] Fatal Error:', error);
        res.status(500).json({ error: error.message });
    }
};

export const createPrescription = async (req: Request, res: Response) => {
    try {
        const { patientId, doctorId, medicines, analysis, extractedText, date } = req.body;

        const prescription = await Prescription.create({
            patientId,
            doctorId,
            medicines,
            analysis, // Can be string or object
            extractedText,
            date: date || new Date()
        });

        res.status(201).json(prescription);
    } catch (error) {
        console.error('Error creating prescription:', error);
        res.status(500).json({ error: 'Failed to create prescription' });
    }
};

export const getPrescriptions = async (req: Request, res: Response) => {
    try {
        const { userId, role } = req.query;
        let query = {};

        if (role === 'patient' && userId) {
            query = { patientId: userId };
        } else if (role === 'doctor' && userId) {
            query = { doctorId: userId };
        }

        if (req.query.patientId) {
            query = { ...query, patientId: req.query.patientId };
        }

        const prescriptions = await Prescription.find(query)
            .populate('patientId', 'name email')
            .populate('doctorId', 'name')
            .sort({ date: -1 });

        res.json(prescriptions);
    } catch (error) {
        console.error('Error fetching prescriptions:', error);
        res.status(500).json({ error: 'Failed to fetch prescriptions' });
    }
};
