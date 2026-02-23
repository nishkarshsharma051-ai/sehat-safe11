import { Request, Response } from "express";
import mongoose from "mongoose";
import User from "../models/User";
import { createWorker } from "tesseract.js";
import pdfParse from 'pdf-parse';
import Prescription from "../models/Prescription";
import fs from 'fs';
import path from 'path';
import { preprocessImage } from "../utils/imageProcessor";
import { MedicalNER } from "../utils/medicalNER";
import { generatePrescriptionPDF } from "../services/pdfService";

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
                const pdfData = await (pdfParse as unknown as (b: Buffer) => Promise<{ text: string }>)(req.file.buffer);
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
                    tessedit_pageseg_mode: '1', // Automatic page segmentation with OSD
                } as Record<string, string>);

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

        interface ExtractedMedicine {
            name: string;
            dosage: string;
            frequency: string;
            duration: string;
            originalLine: string;
        }
        const extractedMedicines: ExtractedMedicine[] = [];
        let doctorName = 'Unknown Doctor';
        let diagnosis = 'Review Required';

        // Patterns
        const doctorPattern = /(?:Dr\.|Doctor|Physician)\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i;
        const diagnosisPattern = /(?:Diagnosis|Dx|Impression)\s*[:\-. ]?\s*([^\n\r]+)/i;

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
                let resolvedPatientId = req.body.patientId;

                // If patientId is not a valid MongoDB ObjectId, it might be a Firebase UID
                if (!mongoose.Types.ObjectId.isValid(resolvedPatientId)) {
                    console.log(`[OCR] patientId ${resolvedPatientId} is not a valid ObjectId, looking up via firebaseUid...`);
                    const user = await User.findOne({ firebaseUid: resolvedPatientId });
                    if (user) {
                        resolvedPatientId = user._id;
                        console.log(`[OCR] Resolved patientId to MongoDB ObjectId: ${resolvedPatientId}`);
                    } else {
                        console.warn(`[OCR] Could not find user with firebaseUid: ${resolvedPatientId}`);
                    }
                }

                if (mongoose.Types.ObjectId.isValid(resolvedPatientId)) {
                    // Get full user details for PDF
                    const fullUser = await User.findById(resolvedPatientId);

                    const prescription = await Prescription.create({
                        patientId: resolvedPatientId,
                        imageUrl: fileUrl,
                        extractedText,
                        medicines: extractedMedicines.map(m => ({
                            name: m.name,
                            dosage: m.dosage,
                            frequency: m.frequency,
                            duration: m.duration
                        })),
                        analysis: JSON.stringify(analysis),
                        date: new Date()
                    });
                    prescriptionId = prescription._id;
                    console.log(`[OCR] Prescription saved successfully with ID: ${prescriptionId}`);

                    // 4. Generate Structured PDF
                    try {
                        const pdfPath = await generatePrescriptionPDF({
                            id: prescriptionId.toString(),
                            patientName: fullUser?.name || "Unknown Patient",
                            doctorName: doctorName,
                            date: new Date().toLocaleDateString(),
                            diagnosis: diagnosis,
                            medicines: extractedMedicines,
                            extractedText: extractedText
                        });

                        // Update prescription with PDF URL
                        await Prescription.findByIdAndUpdate(prescriptionId, { pdfUrl: pdfPath });
                        console.log(`[OCR] PDF generated and linked: ${pdfPath}`);
                        (analysis as any).pdfUrl = pdfPath; // Add to response analysis for frontend
                    } catch (pdfErr) {
                        console.error('[OCR] PDF Generation failed:', pdfErr);
                    }
                } else {
                    console.error('[OCR] Invalid patientId after resolution attempt. Skipping save.');
                }
            } catch (dbError) {
                console.error('[OCR] DB save failed:', dbError);
            }
        }

        res.json({
            extractedText,
            analysis,
            prescriptionId,
            fileUrl,
            success: true
        });

    } catch (error) {
        console.error('[OCR] Fatal Error:', error);
        res.status(500).json({ error: (error as Error).message });
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
            if (mongoose.Types.ObjectId.isValid(userId as string)) {
                query = { patientId: userId };
            } else {
                const user = await User.findOne({ firebaseUid: userId });
                if (user) query = { patientId: user._id };
                else return res.json([]);
            }
        } else if (role === 'doctor' && userId) {
            // Resolve doctor ObjectId (Firebase UID → MongoDB _id)
            let resolvedDoctorId: any = userId as string;
            if (!mongoose.Types.ObjectId.isValid(userId as string)) {
                const dUser = await User.findOne({ firebaseUid: userId });
                if (dUser) resolvedDoctorId = dUser._id;
                else return res.json([]);
            }

            try {
                // Get all patient IDs for whom this doctor has appointments
                const AppointmentModel = (await import('../models/Appointment')).default;
                const doctorApts = await AppointmentModel
                    .find({ doctorId: resolvedDoctorId })
                    .select('patientId')
                    .lean();

                // Filter to only valid MongoDB ObjectIds (skip any Firebase UIDs stored by mistake)
                const patientIds = [...new Set(
                    doctorApts
                        .map((a: any) => a.patientId?.toString())
                        .filter((id: string) => id && mongoose.Types.ObjectId.isValid(id))
                )].map((id: string) => new mongoose.Types.ObjectId(id));

                if (patientIds.length > 0) {
                    query = { $or: [{ patientId: { $in: patientIds } }, { doctorId: resolvedDoctorId }] } as any;
                } else {
                    query = { doctorId: resolvedDoctorId };
                }
            } catch (aptErr) {
                console.error('[Prescriptions] Failed to fetch doctor appointments for join:', aptErr);
                query = { doctorId: resolvedDoctorId }; // Fallback: only direct doctor prescriptions
            }
        }

        if (req.query.patientId) {
            const pId = req.query.patientId as string;
            if (mongoose.Types.ObjectId.isValid(pId)) {
                query = { ...query, patientId: pId };
            } else {
                const user = await User.findOne({ firebaseUid: pId });
                if (user) query = { ...query, patientId: user._id };
            }
        }

        const prescriptions = await Prescription.find(query)
            .populate('patientId', 'name email')
            .populate('doctorId', 'name')
            .sort({ date: -1 });

        res.json(prescriptions);
    } catch (error) {
        console.error('Error fetching prescriptions:', error);
        console.error('Failed query:', JSON.stringify(req.query));
        res.status(500).json({ error: 'Failed to fetch prescriptions' });
    }
};

export const deletePrescription = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const prescription = await Prescription.findByIdAndDelete(id);

        if (!prescription) {
            return res.status(404).json({ error: 'Prescription not found' });
        }

        // Optional: Delete physical file if it exists in uploads
        if (prescription.imageUrl) {
            const filePath = path.join(__dirname, '../../', prescription.imageUrl);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        if (prescription.pdfUrl) {
            const pdfPath = path.join(__dirname, '../../', prescription.pdfUrl);
            if (fs.existsSync(pdfPath)) {
                fs.unlinkSync(pdfPath);
            }
        }

        res.json({ message: 'Prescription deleted successfully' });
    } catch (error) {
        console.error('Error deleting prescription:', error);
        res.status(500).json({ error: 'Failed to delete prescription' });
    }
};
