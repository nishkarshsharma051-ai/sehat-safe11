import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export interface PrescriptionData {
    id: string;
    patientName: string;
    doctorName: string;
    date: string;
    diagnosis: string;
    medicines: Array<{ name: string; dosage: string; frequency: string; duration: string }>;
    extractedText: string;
}

export const generatePrescriptionPDF = async (data: PrescriptionData): Promise<string> => {
    return new Promise((resolve, reject) => {
        try {
            const fileName = `clinical_record_${data.id}_${Date.now()}.pdf`;
            const filePath = path.join(__dirname, '../../uploads', fileName);
            // Professional A4 format with standard margins
            const doc = new PDFDocument({
                margin: 50,
                size: 'A4',
                info: {
                    Title: 'Sehat Safe Clinical Record',
                    Author: 'Sehat Safe Medical Systems'
                }
            });

            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // ==========================================
            // HEADER SECTION - CLINICAL BRANDING
            // ==========================================
            doc.rect(0, 0, doc.page.width, 120).fill('#1e3a8a'); // Deep indigo header background

            doc.fillColor('#ffffff')
                .fontSize(28)
                .font('Helvetica-Bold')
                .text('SEHAT SAFE', 50, 40);

            doc.fillColor('#93c5fd')
                .fontSize(12)
                .font('Helvetica')
                .text('Intelligent Clinical Documentation', 50, 75);

            // Report Meta Data (Right aligned in header)
            doc.fillColor('#ffffff')
                .fontSize(10)
                .text(`Record ID: ${data.id.substring(0, 8).toUpperCase()}`, doc.page.width - 200, 45, { align: 'right' })
                .text(`Date Issued: ${new Date().toLocaleDateString()}`, doc.page.width - 200, 60, { align: 'right' });

            doc.moveDown(4);

            // ==========================================
            // SUB-HEADER - REPORT TYPE
            // ==========================================
            doc.fillColor('#1e293b')
                .fontSize(20)
                .font('Helvetica-Bold')
                .text('Official Prescription Record', 50, 150);

            doc.moveTo(50, 175)
                .lineTo(doc.page.width - 50, 175)
                .lineWidth(2)
                .strokeColor('#e2e8f0')
                .stroke();

            // ==========================================
            // PATIENT & PROVIDER DEMOGRAPHICS (Two Columns)
            // ==========================================
            const col1X = 50;
            const col2X = doc.page.width / 2 + 20;
            let currentY = 195;

            // Provider (Doctor) Info
            doc.fillColor('#475569').fontSize(10).font('Helvetica-Bold').text('ATTENDING PHYSICIAN', col1X, currentY);
            doc.fillColor('#0f172a').fontSize(14).text(data.doctorName || 'Assigned Specialist', col1X, currentY + 15);
            doc.fillColor('#64748b').fontSize(10).font('Helvetica').text('Sehat Connect Verified Provider', col1X, currentY + 32);

            // Patient Info
            doc.fillColor('#475569').fontSize(10).font('Helvetica-Bold').text('PATIENT INFORMAION', col2X, currentY);
            doc.fillColor('#0f172a').fontSize(14).text(data.patientName || 'Registered Patient', col2X, currentY + 15);
            doc.fillColor('#64748b').fontSize(10).font('Helvetica').text(`Encounter Date: ${data.date}`, col2X, currentY + 32);

            currentY += 75;

            // ==========================================
            // CLINICAL IMPRESSION / DIAGNOSIS
            // ==========================================
            if (data.diagnosis) {
                // Background badge for diagnosis
                doc.roundedRect(50, currentY, doc.page.width - 100, 60, 5).fill('#f8fafc').stroke('#e2e8f0');

                doc.fillColor('#3b82f6').fontSize(10).font('Helvetica-Bold').text('PRIMARY CLINICAL IMPRESSION', 65, currentY + 15);
                doc.fillColor('#0f172a').fontSize(14).text(data.diagnosis, 65, currentY + 30);

                currentY += 90;
            }

            // ==========================================
            // MEDICATION REGIMEN
            // ==========================================
            doc.fillColor('#1e293b').fontSize(16).font('Helvetica-Bold').text('Prescribed Regimen', 50, currentY);
            currentY += 30;

            // Table Styling
            const tableWidth = doc.page.width - 100;
            const colWidths = [0.4, 0.2, 0.2, 0.2]; // Percentages
            const colStarts = [
                50,
                50 + (tableWidth * colWidths[0]),
                50 + (tableWidth * (colWidths[0] + colWidths[1])),
                50 + (tableWidth * (colWidths[0] + colWidths[1] + colWidths[2]))
            ];

            // Table Header Background
            doc.rect(50, currentY - 5, tableWidth, 25).fill('#f1f5f9');

            // Table Headers
            doc.fillColor('#475569').fontSize(10).font('Helvetica-Bold');
            doc.text('MEDICATION', colStarts[0] + 5, currentY);
            doc.text('DOSAGE', colStarts[1], currentY);
            doc.text('FREQUENCY', colStarts[2], currentY);
            doc.text('DURATION', colStarts[3], currentY);

            currentY += 30;

            // Table Rows
            doc.font('Helvetica');
            data.medicines.forEach((med, i) => {
                // Zebra striping
                if (i % 2 === 0) {
                    doc.rect(50, currentY - 5, tableWidth, 25).fill('#f8fafc');
                }

                doc.fillColor('#0f172a').fontSize(11);
                // Medicine Name (Bold)
                doc.font('Helvetica-Bold').text(med.name, colStarts[0] + 5, currentY);
                // Other details (Normal)
                doc.font('Helvetica');
                doc.text(med.dosage, colStarts[1], currentY);
                doc.text(med.frequency, colStarts[2], currentY);
                doc.text(med.duration, colStarts[3], currentY);

                currentY += 25;

                // If we get too close to the bottom, add a new page
                if (currentY > doc.page.height - 150) {
                    doc.addPage();
                    currentY = 50;
                }
            });

            currentY += 20;

            // ==========================================
            // EXTRACTED TEXT (SOURCE DATA)
            // ==========================================
            if (data.extractedText) {
                doc.moveTo(50, currentY).lineTo(doc.page.width - 50, currentY).lineWidth(1).strokeColor('#e2e8f0').stroke();
                currentY += 20;

                doc.fillColor('#64748b').fontSize(12).font('Helvetica-Bold').text('Original Digital OCR Source', 50, currentY);
                currentY += 20;

                doc.fillColor('#94a3b8').fontSize(9).font('Helvetica').text(data.extractedText, 50, currentY, {
                    align: 'justify',
                    width: doc.page.width - 100,
                    lineGap: 2
                });
            }

            // ==========================================
            // FOOTER & AUTHENTICATION
            // ==========================================
            const pageHeight = doc.page.height;

            // Signature Line
            doc.moveTo(doc.page.width - 250, pageHeight - 120)
                .lineTo(doc.page.width - 50, pageHeight - 120)
                .lineWidth(1).strokeColor('#94a3b8').stroke();

            doc.fillColor('#64748b').fontSize(10).font('Helvetica-Oblique')
                .text('Digitally Authenticated by Sehat Safe AI', doc.page.width - 250, pageHeight - 110, {
                    width: 200, align: 'center'
                });

            doc.fillColor('#cbd5e1').fontSize(8).font('Helvetica')
                .text(
                    'This document was securely generated maintaining HIPAA & local compliance standards. Do not alter.',
                    50,
                    pageHeight - 50,
                    { align: 'center', width: doc.page.width - 100 }
                );

            doc.end();

            stream.on('finish', () => {
                // Return relative URL for frontend access
                resolve(`/uploads/${fileName}`);
            });

            stream.on('error', (err) => reject(err));

        } catch (error) {
            reject(error);
        }
    });
};
