import { Prescription } from '../types';

/**
 * Shared utility to handle prescription PDF downloads.
 * Tries the backend-generated PDF first, then falls back to a rich client-side PDF.
 */
export const downloadPrescriptionPdf = async (p: Prescription) => {
    // ── 1. Prefer the backend-generated PDF if it exists ──────────────────
    const backendPdfUrl = (p as any).pdfUrl || (p as any).file_url?.toLowerCase().endsWith('.pdf') ? (p as any).file_url : null;

    if (backendPdfUrl) {
        try {
            const fullUrl = backendPdfUrl.startsWith('http')
                ? backendPdfUrl
                : `${window.location.origin}${backendPdfUrl}`;
            const response = await fetch(fullUrl);
            if (response.ok) {
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Prescription_${p.id}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                return;
            }
        } catch (e) {
            console.warn('Backend PDF download failed, falling back to client-side generation', e);
        }
    }

    // ── 2. Generate a rich, readable PDF client-side via jsPDF ────────────
    try {
        const jsPDF = (await import('jspdf')).default;
        const autoTable = (await import('jspdf-autotable')).default;

        const doc = new jsPDF({ unit: 'mm', format: 'a4' });
        const PW = doc.internal.pageSize.getWidth();  // 210mm

        // ── Branded header bar ──
        doc.setFillColor(79, 70, 229); // indigo-600
        doc.rect(0, 0, PW, 38, 'F');

        // App logo / title
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.text('Sehat Safe', 14, 18);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text('Digital Health Record', 14, 26);

        // Date stamp on the right
        const printedOn = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
        doc.text(`Printed: ${printedOn}`, PW - 14, 26, { align: 'right' });

        // ── Prescription ID ribbon ──
        doc.setFillColor(238, 242, 255); // indigo-50
        doc.rect(0, 38, PW, 12, 'F');
        doc.setTextColor(79, 70, 229);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(`Prescription ID: ${p.id || 'N/A'}`, 14, 46);

        // ── Info block ──
        let y = 60;
        doc.setTextColor(30, 30, 30);

        const infoRows = [
            ['Doctor', p.doctor_name || 'Unknown Doctor'],
            ['Date', new Date(p.created_at || new Date()).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })],
            ['Diagnosis', p.diagnosis || '—'],
        ];

        infoRows.forEach(([label, value]) => {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(100, 116, 139); // slate-500
            doc.text(label.toUpperCase(), 14, y);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10.5);
            doc.setTextColor(15, 23, 42); // slate-900
            const wrapped = doc.splitTextToSize(value, 160);
            doc.text(wrapped, 14, y + 5);
            y += 5 + wrapped.length * 5.5 + 6; // Better spacing
        });

        // ── Medicines table ──
        y += 4;
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(79, 70, 229);
        doc.text('Prescribed Medicines', 14, y);
        y += 4;

        if (p.medicines && p.medicines.length > 0) {
            autoTable(doc, {
                startY: y,
                head: [['Medicine', 'Dosage', 'Frequency', 'Duration']],
                body: p.medicines.map((m: any) => [
                    m.name || '—',
                    m.dosage || '—',
                    m.frequency || '—',
                    m.duration || '—',
                ]),
                theme: 'grid',
                styles: { fontSize: 10, cellPadding: 3 },
                headStyles: {
                    fillColor: [79, 70, 229],
                    textColor: 255,
                    fontStyle: 'bold',
                },
                alternateRowStyles: { fillColor: [238, 242, 255] },
                margin: { left: 14, right: 14 },
            });
            y = (doc as any).lastAutoTable.finalY + 10;
        } else {
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(10);
            doc.setTextColor(100, 116, 139);
            doc.text('No medicines detected', 14, y + 6);
            y += 16;
        }

        // ── AI / Extracted text section ──
        if (p.extracted_text) {
            if (y > 240) doc.addPage();
            doc.setFontSize(13);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(79, 70, 229);
            doc.text('Extracted Notes (OCR)', 14, y);
            y += 6;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(51, 65, 85); // slate-700
            const textLines = doc.splitTextToSize(p.extracted_text.trim(), 182);
            const visibleLines = textLines.slice(0, 30);
            doc.text(visibleLines, 14, y);
            y += visibleLines.length * 4.5 + 8;
            if (textLines.length > 30) {
                doc.setTextColor(100, 116, 139);
                doc.text('(content truncated — see original document below)', 14, y);
            }
        }

        // ── Footer Helper ──
        const addFooter = () => {
            const totalPages = doc.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(148, 163, 184); // slate-400
                doc.text(
                    'This is a digitally generated document by Sehat Safe. Always consult your physician.',
                    PW / 2, 290, { align: 'center' }
                );
                doc.text(`Page ${i} of ${totalPages}`, PW - 14, 290, { align: 'right' });
            }
        };

        // ── Page 2: embed original document image ──
        const fileUrl = p.file_url || (p as any).imageUrl;
        if (fileUrl) {
            doc.addPage();
            doc.setFillColor(79, 70, 229);
            doc.rect(0, 0, PW, 20, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(255, 255, 255);
            doc.text('Original Document', 14, 13);

            try {
                const img = new Image();
                img.crossOrigin = 'Anonymous';
                img.src = fileUrl.startsWith('http')
                    ? fileUrl
                    : `${window.location.origin}${fileUrl}`;

                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                });

                const maxW = PW - 28;  // 182mm
                const maxH = 255;      // mm, leaves room for footer
                const ratio = img.width / img.height;
                let iw = maxW;
                let ih = iw / ratio;
                if (ih > maxH) { ih = maxH; iw = ih * ratio; }

                const ix = (PW - iw) / 2;
                doc.addImage(img, img.src.endsWith('.png') ? 'PNG' : 'JPEG', ix, 25, iw, ih);
            } catch (e) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10);
                doc.setTextColor(239, 68, 68);
                doc.text('Original image could not be embedded (CORS or load error)', 14, 35);
                doc.setTextColor(79, 70, 229);
                doc.textWithLink('Click here to view online', 14, 43, { url: `${window.location.origin}${fileUrl}` });
            }
        }

        addFooter();
        const safeName = (p.doctor_name || 'Prescription').replace(/\s+/g, '_');
        const dateStr = new Date(p.created_at || new Date()).toISOString().slice(0, 10);
        doc.save(`SehatSafe_${safeName}_${dateStr}.pdf`);

    } catch (e) {
        console.error('PDF Generation failed', e);
        // Generic download fallback
        const fileUrl = p.file_url || (p as any).imageUrl;
        if (fileUrl) {
            const a = document.createElement('a');
            a.href = fileUrl.startsWith('http') ? fileUrl : `${window.location.origin}${fileUrl}`;
            a.target = '_blank';
            a.download = `Prescription_${p.id || 'download'}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } else {
            alert('No downloadable file found for this prescription.');
        }
    }
};
