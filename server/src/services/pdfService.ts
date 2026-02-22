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
            const fileName = `prescription_${data.id}_${Date.now()}.pdf`;
            const filePath = path.join(__dirname, '../../uploads', fileName);
            const doc = new PDFDocument({ margin: 50 });

            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // Header
            doc.fillColor('#2563eb').fontSize(24).text('SEHAT SAFE', { align: 'center' });
            doc.fillColor('#64748b').fontSize(10).text('Your Digital Health Companion', { align: 'center' });
            doc.moveDown(2);

            // Prescription Info
            doc.fillColor('#1e293b').fontSize(18).text('Medical Prescription', { underline: true });
            doc.moveDown(1);

            doc.fontSize(12).fillColor('#000');
            doc.text(`Prescription ID: ${data.id}`);
            doc.text(`Date: ${data.date}`);
            doc.moveDown(1);

            // Patient & Doctor Info
            doc.fontSize(14).fillColor('#2563eb').text('Details:');
            doc.fontSize(12).fillColor('#000');
            doc.text(`Patient Name: ${data.patientName}`);
            doc.text(`Doctor Name: ${data.doctorName}`);
            doc.text(`Diagnosis: ${data.diagnosis || 'N/A'}`);
            doc.moveDown(1);

            // Medicines Table
            doc.fontSize(14).fillColor('#2563eb').text('Prescribed Medicines:');
            doc.moveDown(0.5);

            // Table Headers
            const startX = 50;
            let currentY = doc.y;
            doc.fontSize(10).fillColor('#64748b');
            doc.text('Medicine Name', startX, currentY);
            doc.text('Dosage', startX + 150, currentY);
            doc.text('Frequency', startX + 250, currentY);
            doc.text('Duration', startX + 350, currentY);

            doc.moveTo(startX, currentY + 15).lineTo(550, currentY + 15).strokeColor('#e2e8f0').stroke();
            doc.moveDown(1);

            // Table Rows
            doc.fillColor('#000');
            data.medicines.forEach((med) => {
                currentY = doc.y;
                doc.text(med.name, startX, currentY);
                doc.text(med.dosage, startX + 150, currentY);
                doc.text(med.frequency, startX + 250, currentY);
                doc.text(med.duration, startX + 350, currentY);
                doc.moveDown(0.5);
            });

            doc.moveDown(1);

            // Extracted Text Section
            if (data.extractedText) {
                doc.fontSize(14).fillColor('#2563eb').text('Original Extracted Text:');
                doc.fontSize(9).fillColor('#64748b').text(data.extractedText, {
                    align: 'justify',
                    width: 500
                });
            }

            // Footer
            const pageHeight = doc.page.height;
            doc.fontSize(10).fillColor('#94a3b8').text(
                'This is a digitally generated report based on OCR analysis.',
                50,
                pageHeight - 70,
                { align: 'center', width: 500 }
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
