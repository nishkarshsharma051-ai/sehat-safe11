import { InsuranceCoverage } from '../types';

// Mock Pharmacy Benefit Manager (PBM) Service
class InsuranceService {
    private mockDatabase: Record<string, InsuranceCoverage> = {
        'atorvastatin': {
            drugName: 'Atorvastatin',
            covered: true,
            tier: 1,
            copay: 5,
            paRequired: false,
        },
        'lipitor': {
            drugName: 'Lipitor',
            covered: false,
            tier: 3,
            copay: 150,
            paRequired: true,
            alternatives: ['Atorvastatin', 'Rosuvastatin']
        },
        'eliquis': {
            drugName: 'Eliquis',
            covered: true,
            tier: 2,
            copay: 45,
            paRequired: true,
            alternatives: ['Warfarin', 'Xarelto']
        },
        'warfarin': {
            drugName: 'Warfarin',
            covered: true,
            tier: 1,
            copay: 4,
            paRequired: false,
        },
        'semaglutide': {
            drugName: 'Semaglutide',
            covered: false,
            tier: 4,
            copay: 850,
            paRequired: true,
            alternatives: ['Metformin', 'Liraglutide (Victoza)']
        },
        'metformin': {
            drugName: 'Metformin',
            covered: true,
            tier: 1,
            copay: 0,
            paRequired: false,
        },
        'amoxicillin': {
            drugName: 'Amoxicillin',
            covered: true,
            tier: 1,
            copay: 10,
            paRequired: false,
        }
    };

    /**
     * Check coverage for a specific drug.
     * In a real app, this would make an API call to a clearinghouse (e.g., Surescripts, CoverMyMeds).
     */
    async checkCoverage(drugName: string): Promise<InsuranceCoverage> {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));

        const key = drugName.toLowerCase().trim();

        if (this.mockDatabase[key]) {
            return this.mockDatabase[key];
        }

        // Default fallback for unknown drugs
        return {
            drugName,
            covered: true,
            tier: 2,
            copay: 20,
            paRequired: false,
        };
    }
}

export const insuranceService = new InsuranceService();
