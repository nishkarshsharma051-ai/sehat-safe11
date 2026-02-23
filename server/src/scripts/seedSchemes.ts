import dotenv from 'dotenv';
import { connectDB } from '../config/db';
import Scheme from '../models/Scheme';
import mongoose from 'mongoose';

dotenv.config();

const schemes = [
    {
        name: 'Ayushman Bharat (PM-JAY)',
        description: 'World\'s largest health insurance scheme providing a cover of Rs. 5 lakhs per family per year for secondary and tertiary care hospitalization.',
        eligibility: {
            incomeLimit: 250000,
            chronicConditions: ['Cancer', 'Cardiac', 'Renal', 'Neurological'],
            gender: 'all',
            states: []
        },
        benefits: [
            'Rs. 5 Lakhs coverage per family per year',
            'Cashless treatment at empanelled hospitals',
            'Covers pre and post hospitalization expenses'
        ],
        applyLink: 'https://setu.pmjay.gov.in/setu/',
        category: 'central'
    },
    {
        name: 'Janani Suraksha Yojana (JSY)',
        description: 'A safe motherhood intervention under the National Health Mission (NHM) to reduce maternal and neonatal mortality by promoting institutional delivery.',
        eligibility: {
            gender: 'female',
            chronicConditions: [],
            states: []
        },
        benefits: [
            'Cash assistance for institutional delivery',
            'Free transport and medicines',
            'Post-natal care and immunization'
        ],
        applyLink: 'https://nhm.gov.in/index1.php?lang=1&level=3&sublinkid=841&lid=309',
        category: 'central'
    },
    {
        name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana (PMBJP)',
        description: 'Campaign launched by the Department of Pharmaceuticals to provide quality medicines at affordable prices to the masses through dedicated outlets.',
        eligibility: {
            gender: 'all',
            chronicConditions: ['Diabetes', 'Hypertension', 'Asthma'],
            states: []
        },
        benefits: [
            'Generic medicines at 50%-90% lower prices',
            'Quality equivalent to branded medicines',
            'Available across 9000+ Kendras'
        ],
        applyLink: 'https://janaushadhi.gov.in/',
        category: 'central'
    },
    {
        name: 'Central Government Health Scheme (CGHS)',
        description: 'Comprehensive medical care facilities for Central Government employees and pensioners enrolled under the scheme.',
        eligibility: {
            incomeLimit: 1200000,
            gender: 'all',
            chronicConditions: [],
            states: []
        },
        benefits: [
            'OPD treatment and specialist consultation',
            'Hospitalization at govt and empanelled hosptials',
            'Cashless facility for pensioners'
        ],
        applyLink: 'https://cghs.nic.in/',
        category: 'central'
    },
    {
        name: 'Rashtriya Arogya Nidhi (RAN)',
        description: 'Financial assistance to patients living below poverty line who are suffering from major life-threatening diseases.',
        eligibility: {
            incomeLimit: 150000,
            chronicConditions: ['Cancer', 'Cardiac', 'Renal', 'Organ Transplant'],
            states: []
        },
        benefits: [
            'One-time financial grant up to Rs. 15 Lakhs',
            'Treatment at super-specialty government hospitals',
            'Covers life-saving surgeries and implants'
        ],
        applyLink: 'https://main.mohfw.gov.in/Rashtriya-Arogya-Nidhi',
        category: 'central'
    },
    {
        name: 'AB-PMJAY Sehat (Jammu & Kashmir)',
        description: 'Universal health insurance cover for all residents of J&K, providing the same benefits as PM-JAY.',
        eligibility: {
            gender: 'all',
            chronicConditions: [],
            states: ['Jammu & Kashmir']
        },
        benefits: [
            'Rs. 5 Lakhs coverage for all J&K residents',
            'Floater basis family coverage',
            'Portability across India'
        ],
        applyLink: 'https://sha.jk.gov.in/',
        category: 'state'
    },
    {
        name: 'Pradhan Mantri Surakshit Matritva Abhiyan (PMSMA)',
        description: 'Ensures quality antenatal care to all pregnant women in the country on the 9th of every month.',
        eligibility: {
            gender: 'female',
            chronicConditions: [],
            states: []
        },
        benefits: [
            'Free health checkups for pregnant women',
            'Diagnostic and specialist services',
            'Identification of high-risk pregnancies'
        ],
        applyLink: 'https://pmsma.mohfw.gov.in',
        category: 'central'
    }
];

const seedSchemes = async () => {
    try {
        await connectDB();

        // Clear existing schemes
        await Scheme.deleteMany({});

        // Insert new schemes
        await Scheme.insertMany(schemes);

        console.log('Schemes seeded successfully');
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Error seeding schemes:', error);
        process.exit(1);
    }
};

seedSchemes();
