import sharp from 'sharp';

/**
 * Preprocess image buffer for better OCR results
 * 1. Convert to grayscale
 * 2. Increase contrast (thresholding)
 * 3. Resize if too small/large
 * 4. Sharpen
 */
export async function preprocessImage(buffer: Buffer): Promise<Buffer> {
    try {
        const image = sharp(buffer);
        const metadata = await image.metadata();

        let processed = image
            .grayscale() // Remove color noise
            .normalize() // Stretch contrast
            .sharpen({ sigma: 1.5 }) // Sharpen edges
            .linear(1.5, -0.2); // Increase contrast manually: pixel * 1.5 - 0.2

        // Resize if too small width < 1000px
        if (metadata.width && metadata.width < 1000) {
            processed = processed.resize({ width: 2000, withoutEnlargement: false });
        }

        // Convert to high quality PNG buffer
        return await processed.png({ quality: 100 }).toBuffer();
    } catch (error) {
        console.error("Image Preprocessing Error:", error);
        return buffer; // Return original on fail
    }
}
