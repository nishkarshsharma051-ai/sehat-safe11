import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { encrypt } from '../utils/encryption';

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

const encryptKey = () => {
    try {
        const secret = process.env.CREDENTIALS_SECRET;
        if (!secret) {
            console.error('❌ Error: CREDENTIALS_SECRET is not set in .env');
            process.exit(1);
        }

        const inputPath = path.join(__dirname, '../../service-account.json');
        const outputPath = path.join(__dirname, '../../service-account.enc');

        if (!fs.existsSync(inputPath)) {
            console.error('❌ Error: service-account.json not found in server root.');
            console.log('Please place your Google Cloud JSON key there first.');
            process.exit(1);
        }

        const rawData = fs.readFileSync(inputPath, 'utf8');
        const encryptedData = encrypt(rawData, secret);

        fs.writeFileSync(outputPath, encryptedData);
        console.log('✅ Success! Encrypted key saved to service-account.enc');
        console.log('You can now remove service-account.json (or keep it locally, but DO NOT commit it).');

    } catch (error) {
        console.error('❌ Encryption failed:', error);
        process.exit(1);
    }
};

encryptKey();
