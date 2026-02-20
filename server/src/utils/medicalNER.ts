
import { distance } from 'fastest-levenshtein';

// Common medicines list (expanded)
const MEDICINE_DATABASE = [
    "Paracetamol", "Dolo", "Crocin", "Calpol", "Metacin",
    "Ibuprofen", "Brufen", "Combiflam", "Advil",
    "Cetirizine", "Okacet", "Cetzine", "Zyrtec",
    "Levocetirizine", "Levocet", "Teczine",
    "Amoxicillin", "Mox", "Novamox", "Augmentin", "Clamp",
    "Azithromycin", "Azithral", "Azee", "Zithromax",
    "Pantoprazole", "Pan", "Pantocid", "Pantop",
    "Omeprazole", "Omez",
    "Rabeprazole", "Rablet", "Razo",
    "Montelukast", "Montek", "Telekast",
    "Metformin", "Glycomet", "Glucophage",
    "Amlodipine", "Amlong", "Stamlo",
    "Telmisartan", "Telma", "Telmikind",
    "Atorvastatin", "Atorva", "Lipitor",
    "Rosuvastatin", "Rosuvas",
    "Aspirin", "Ecosprin", "Disprin",
    "Clopidogrel", "Clavix",
    "Thyroxine", "Thyronorm", "Eltroxin",
    "Metogel", "Digene", "Gelusil", "Mucaine",
    "Multivitamin", "Becosules", "Supradyn", "Zincovit",
    "Calcium", "Shelcal", "Caldikind",
    "Vitamin D3", "Uprise D3", "Arachitol",
    "Iron", "Dexorange", "Fefol",
    "Cough Syrup", "Benadryl", "Ascoril", "Grilinctus",
    "Antibiotic", "Painkiller", "Antacid"
];

const DOSAGE_PATTERNS = [
    /\d+\s*(?:mg|ml|g|mcg|IU)/i,
    /\d+\.?\d*\s*(?:tablets?|caps?|pills?|sachet)/i
];

const FREQUENCY_PATTERNS = {
    'OD': /once\s*a\s*day|1\s*time|OD/i,
    'BD': /twice\s*a\s*day|2\s*times|BD|BID/i,
    'TDS': /thrice\s*a\s*day|3\s*times|TDS|TID/i,
    'SOS': /when\s*needed|SOS|pain/i,
    'HS': /bedtime|night|HS/i,
    'BBF': /before\s*breakfast|empty\s*stomach/i,
    'AF': /after\s*food|after\s*meal/i
};

export class MedicalNER {
    /**
     * Find best matching medicine name using Levenshtein distance
     */
    static correctMedicineName(text: string): string | null {
        // Clean text: remove numbers, dots, special chars
        const cleanText = text.replace(/[^a-zA-Z]/g, '');
        if (cleanText.length < 3) return null;

        let bestMatch = null;
        let minDistance = Infinity;

        for (const med of MEDICINE_DATABASE) {
            const d = distance(cleanText.toLowerCase(), med.toLowerCase());

            // Allow distance based on length (longer words tolerate more errors)
            const threshold = Math.floor(med.length * 0.4); // 40% error tolerance

            if (d <= threshold && d < minDistance) {
                minDistance = d;
                bestMatch = med;
            }
        }

        return bestMatch;
    }

    static extractDosage(text: string): string {
        for (const pattern of DOSAGE_PATTERNS) {
            const match = text.match(pattern);
            if (match) return match[0];
        }
        return 'As prescribed';
    }

    static extractFrequency(text: string): string {
        for (const [key, pattern] of Object.entries(FREQUENCY_PATTERNS)) {
            if (pattern.test(text)) return key;
        }
        return 'Dosage as directed';
    }

    static extractDuration(text: string): string {
        const match = text.match(/\d+\s*(?:days?|weeks?|months?)/i);
        return match ? match[0] : 'As prescribed';
    }
}
