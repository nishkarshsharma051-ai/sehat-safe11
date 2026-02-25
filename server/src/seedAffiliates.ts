import mongoose from 'mongoose';
import Affiliate from './models/Affiliate';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const affiliates = [
    {
        name: 'Apollo Hospital Bangalore',
        type: 'hospital',
        address: '154, IIM, 11, Bannerghatta Main Rd, Bangalore',
        phone: '+91 80 2630 4050',
        website: 'https://bangalore.apollohospitals.com',
        location: {
            type: 'Point',
            coordinates: [77.5985, 12.8953] // [lng, lat]
        },
        services: ['Cardiology', 'Oncology', 'Emergency'],
        rating: 4.8,
        isVerified: true
    },
    {
        name: 'Manipal Hospital Hal Road',
        type: 'hospital',
        address: '98, HAL Old Airport Rd, Kodihalli, Bangalore',
        phone: '+91 80 2222 1111',
        website: 'https://www.manipalhospitals.com',
        location: {
            type: 'Point',
            coordinates: [77.6481, 12.9602]
        },
        services: ['Neurology', 'Surgery', 'Pediatrics'],
        rating: 4.7,
        isVerified: true
    },
    {
        name: 'SRL Diagnostics',
        type: 'lab',
        address: 'Indiranagar, Bangalore',
        phone: '+91 80 4444 3333',
        location: {
            type: 'Point',
            coordinates: [77.6387, 12.9784]
        },
        services: ['Blood Test', 'Pathology', 'X-Ray'],
        rating: 4.5,
        isVerified: true
    },
    {
        name: 'Narayana Health City',
        type: 'hospital',
        address: 'Hosur Road, Bangalore',
        phone: '+91 80 6750 6750',
        location: {
            type: 'Point',
            coordinates: [77.6914, 12.8123]
        },
        services: ['Cardiac Sciences', 'Nephrology'],
        rating: 4.9,
        isVerified: true
    },
    {
        name: 'Apollo Hospital Noida',
        type: 'hospital',
        address: 'Sector 26, Noida, Uttar Pradesh',
        phone: '+91 120 401 2000',
        website: 'https://noida.apollohospitals.com',
        location: {
            type: 'Point',
            coordinates: [77.3456, 28.5734] // [lng, lat]
        },
        services: ['Emergency', 'Cardiology', 'Orthopedics'],
        rating: 4.6,
        isVerified: true
    },
    {
        name: 'Max Super Speciality Hospital',
        type: 'hospital',
        address: 'W-3, Sector 1, Vaishali, Ghaziabad',
        phone: '+91 120 417 3000',
        location: {
            type: 'Point',
            coordinates: [77.3392, 28.6434]
        },
        services: ['Neurology', 'Oncology'],
        rating: 4.5,
        isVerified: true
    },
    {
        name: 'Fortis Memorial Research Institute',
        type: 'hospital',
        address: 'Sector 44, Gurgaon, Haryana',
        phone: '+91 124 496 2200',
        location: {
            type: 'Point',
            coordinates: [77.0722, 28.4551]
        },
        services: ['Multi-speciality', 'Surgery'],
        rating: 4.7,
        isVerified: true
    },
    {
        name: 'Dr. Lal PathLabs',
        type: 'lab',
        address: 'Noida Sector 18, Uttar Pradesh',
        phone: '+91 120 432 1000',
        location: {
            type: 'Point',
            coordinates: [77.3260, 28.5700]
        },
        services: ['Blood Test', 'Pathology', 'MRI'],
        rating: 4.4,
        isVerified: true
    }
];

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        console.log('Connected to MongoDB');

        await Affiliate.deleteMany({});
        console.log('Cleared existing affiliates');

        await Affiliate.insertMany(affiliates);
        console.log('Seeded affiliates successfully');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seed();
