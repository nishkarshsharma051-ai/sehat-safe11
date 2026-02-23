import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';

dotenv.config();

// Connect to Database
connectDB();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
    origin: ['http://localhost:5173', 'https://sehatsafe.netlify.app', process.env.FRONTEND_URL as string],
    credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => {
    res.send('Sehat Safe Server is running');
});

// Health Check Endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date(), message: 'Server is healthy' });
});

import prescriptionRoutes from './routes/prescription.routes';
import chatRoutes from './routes/chat.routes';
import doctorRoutes from './routes/doctor.routes';
import appointmentRoutes from './routes/appointment.routes';
import authRoutes from './routes/auth.routes';
import hospitalRoutes from './routes/hospital.routes';
import reminderRoutes from './routes/reminder.routes';
import healthRoutes from './routes/health.routes';
import patientDataRoutes from './routes/patientData.routes';

app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api', chatRoutes);
app.use('/api', doctorRoutes);
app.use('/api', appointmentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/health-data', healthRoutes);
app.use('/api/patient-data', patientDataRoutes);

import patientRoutes from './routes/patient.routes';
import adminRoutes from './routes/admin.routes';
import schemeRoutes from './routes/schemeRoutes';

app.use('/api/patients', patientRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/schemes', schemeRoutes);


app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
