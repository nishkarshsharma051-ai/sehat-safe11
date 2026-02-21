# Sehat Safe - AI-Powered Digital Health Wallet

A comprehensive full-stack health management application for India, featuring AI-powered prescription analysis, appointment booking, medicine reminders, and health chatbot.

## Features

### For Patients
- **Upload & Analyze Prescriptions**: Upload prescription images or PDFs with automatic OCR text extraction using Google Vision API
- **AI Health Insights**: Get AI-generated health summaries and medicine information using Gemini API
- **Appointment Booking**: Search and book appointments with doctors by specialization
- **Medicine Reminders**: Set up automated reminders for medicines with custom schedules
- **AI Health Assistant**: Chat with an AI-powered health assistant for general health queries
- **Secure Storage**: All prescriptions stored securely in the cloud with role-based access

### For Doctors
- **Appointment Management**: View and manage patient appointments
- **Patient Dashboard**: Access patient information and appointment history
- **Status Updates**: Confirm, complete, or cancel appointments
- **Add Notes**: Add consultation notes to appointments

### For Admins
- **User Management**: View and manage all users (patients, doctors, admins)
- **Analytics Dashboard**: Monitor system usage with comprehensive statistics
- **Appointment Oversight**: View all appointments across the platform
- **Prescription Monitoring**: Track all uploaded prescriptions

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling with glassmorphism design
- **Vite** for fast development and building
- **Lucide React** for beautiful icons

### Backend
- **Supabase**
  - PostgreSQL database with Row Level Security
  - Authentication with JWT
  - Real-time subscriptions
  - Cloud Storage for prescription files
  - Edge Functions (serverless)

### AI/ML Services
- **Google Vision API** - OCR for prescription text extraction
- **Gemini API** - AI-powered health summaries and chatbot

## Database Schema

### Tables
- `user_profiles` - Extended user information with role management
- `prescriptions` - Prescription documents and extracted data
- `appointments` - Doctor appointment bookings
- `medicine_reminders` - Medicine reminder schedules
- `chat_history` - AI chatbot conversation history

### Security
- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Doctors can view patient data for their appointments
- Admins have full access

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- Supabase account
- Google Cloud account with Vision API enabled
- Google AI Studio account for Gemini API

### 1. Clone and Install

\`\`\`bash
npm install
\`\`\`

### 2. Environment Variables

The Supabase connection details are already configured. The following environment variables are available:

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

### 3. Database Setup

The database schema has been automatically created with all necessary tables, RLS policies, and storage buckets.

### 4. Edge Functions

The following Edge Functions are deployed and ready to use:

- **process-prescription** - Handles OCR and AI analysis of prescriptions
- **ai-chatbot** - Powers the AI health assistant
- **get-doctors** - Retrieves available doctors

**Important**: The Edge Functions require API keys for external services:
- `GOOGLE_VISION_API_KEY` - For OCR text extraction
- `GEMINI_API_KEY` - For AI-powered features

To obtain these API keys:

#### Google Vision API Key:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Vision API
4. Create credentials (API Key)
5. Copy the API key

#### Gemini API Key:
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Get API Key"
4. Create an API key
5. Copy the API key

The secrets are automatically configured in your Edge Functions environment.

### 5. Run Development Server

\`\`\`bash
npm run dev
\`\`\`

The application will be available at `http://localhost:5173`

### 6. Build for Production

\`\`\`bash
npm run build
\`\`\`

## Usage Guide

### Creating an Account

1. Click "Sign Up" on the login page
2. Fill in your details
3. Choose your role:
   - **Patient**: For individuals managing their health
   - **Doctor**: For healthcare providers
4. Complete registration

### For Patients

#### Upload a Prescription
1. Navigate to "Prescriptions" in the dashboard
2. Click "Upload New Prescription"
3. Select an image or PDF file
4. Wait for AI processing (OCR + analysis)
5. View extracted medicines, diagnosis, and AI health summary

#### Book an Appointment
1. Go to "Appointments"
2. Click "Book New Appointment"
3. Search for a doctor by name or specialization
4. Select date and time
5. Describe your reason for visit
6. Submit booking

#### Set Medicine Reminders
1. Navigate to "Reminders"
2. Click "Add Reminder"
3. Enter medicine details (name, dosage, frequency)
4. Set start and end dates
5. Configure reminder times
6. Activate reminder

#### Chat with AI Assistant
1. Go to "AI Assistant"
2. Type your health question
3. Get instant AI-powered responses
4. Chat history is automatically saved

### For Doctors

#### Manage Appointments
1. View all your appointments in the dashboard
2. Confirm pending appointments
3. Add consultation notes
4. Mark appointments as completed

### For Admins

#### Monitor System
1. View comprehensive statistics on the overview page
2. Manage user accounts
3. Monitor appointments and prescriptions
4. Track system usage

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Row Level Security**: Database-level access control
- **Role-Based Access**: Different permissions for patients, doctors, and admins
- **Secure Storage**: Prescriptions stored in private buckets
- **HTTPS Only**: All API calls use secure connections

## API Integration

### Edge Functions Endpoints

All Edge Functions are accessible at:
\`\`\`
https://your-project.supabase.co/functions/v1/[function-name]
\`\`\`

Include the authorization header:
\`\`\`
Authorization: Bearer YOUR_SUPABASE_ANON_KEY
\`\`\`

## Design Features

- **Glassmorphism UI**: Modern frosted glass effect design
- **Health-Tech Theme**: Blue and green gradient color scheme
- **Responsive Design**: Works seamlessly on mobile, tablet, and desktop
- **Smooth Animations**: Hover effects and transitions throughout
- **Intuitive Navigation**: Clear role-based navigation and workflows

## Troubleshooting

### Prescription Upload Issues
- Ensure the file is an image (JPG, PNG) or PDF
- File size should be under 10MB
- Check that the prescription is clear and readable

### API Key Configuration
- If OCR or AI features aren't working, verify your API keys are set correctly
- Check that Google Vision API is enabled in your Google Cloud project
- Ensure your Gemini API key is valid and active

### Authentication Issues
- Clear browser cache and cookies
- Ensure you're using a valid email address
- Check that your Supabase project is active

## Contributing

This is a production-ready application built with modern web technologies and best practices for healthcare applications in India.

## License

MIT License - Feel free to use this project for your healthcare applications.

## Support

For issues or questions, please check the troubleshooting section or review the inline code documentation.

---

Built with ❤️ for healthier India
# sehat-safe
