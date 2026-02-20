# Sehat Safe - Complete Setup Guide

This guide will walk you through setting up Sehat Safe from scratch.

## Quick Start

Your Sehat Safe application is already configured with:
- ✅ Database schema with all tables
- ✅ Row Level Security policies
- ✅ Storage buckets
- ✅ Edge Functions deployed
- ✅ Authentication system

## What You Need to Configure

### API Keys for AI Features

The application requires two API keys for the AI-powered features to work:

1. **Google Vision API Key** - For OCR (text extraction from prescriptions)
2. **Gemini API Key** - For AI health summaries and chatbot

These keys are automatically configured in your Edge Functions. Here's how to obtain them:

### 1. Google Vision API Key

**Step-by-Step Instructions:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)

2. **Create or Select a Project**
   - Click on the project dropdown at the top
   - Click "New Project"
   - Enter a project name (e.g., "Sehat Safe")
   - Click "Create"

3. **Enable Vision API**
   - In the left sidebar, click "APIs & Services" > "Library"
   - Search for "Cloud Vision API"
   - Click on "Cloud Vision API"
   - Click "Enable"

4. **Create API Key**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the generated API key
   - (Optional) Click "Restrict Key" to limit usage to Vision API only

5. **Save Your Key**
   - Store this key securely
   - You'll use it as `GOOGLE_VISION_API_KEY`

**Free Tier:** Google Vision API offers 1,000 free requests per month.

### 2. Gemini API Key

**Step-by-Step Instructions:**

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)

2. **Sign In**
   - Use your Google account to sign in

3. **Get API Key**
   - Click "Get API Key"
   - If you don't have a project, click "Create API Key in new project"
   - Otherwise, select an existing project

4. **Copy Your Key**
   - Copy the generated API key
   - Store it securely
   - You'll use it as `GEMINI_API_KEY`

**Free Tier:** Gemini API offers generous free usage limits.

## Testing the Application

### 1. Create Test Accounts

**Patient Account:**
- Email: `patient@test.com`
- Password: `password123`
- Role: Patient
- Full Name: `Test Patient`

**Doctor Account:**
- Email: `doctor@test.com`
- Password: `password123`
- Role: Doctor
- Full Name: `Dr. Test Doctor`
- Specialization: `General Physician`

**Admin Account:**
- Email: `admin@test.com`
- Password: `password123`
- Role: Patient (then manually update in database to 'admin')

### 2. Test Features

#### As a Patient:
1. **Upload a Prescription**
   - Use a sample prescription image
   - Wait for AI processing
   - Verify OCR text extraction
   - Check AI health summary

2. **Book an Appointment**
   - Search for doctors
   - Book an appointment with the test doctor
   - Check appointment status

3. **Set Medicine Reminder**
   - Add a medicine with dosage
   - Set reminder times
   - Verify reminder is created

4. **Chat with AI**
   - Ask a health question
   - Verify AI response
   - Check chat history

#### As a Doctor:
1. **View Appointments**
   - Check pending appointments
   - Confirm an appointment
   - Add notes to consultation
   - Mark appointment as completed

#### As an Admin:
1. **View Statistics**
   - Check user counts
   - Review appointment statistics
   - Monitor prescriptions

2. **Manage Users**
   - View all users
   - Check user roles
   - Review user details

## Project Structure

\`\`\`
sehat-safe/
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   │   ├── Login.tsx           # Login page
│   │   │   └── Register.tsx        # Registration page
│   │   ├── Patient/
│   │   │   ├── PatientDashboard.tsx      # Patient main dashboard
│   │   │   ├── PrescriptionUpload.tsx    # Upload prescriptions
│   │   │   ├── PrescriptionList.tsx      # View prescriptions
│   │   │   ├── AppointmentBooking.tsx    # Book appointments
│   │   │   └── MedicineReminders.tsx     # Manage reminders
│   │   ├── Doctor/
│   │   │   └── DoctorDashboard.tsx       # Doctor dashboard
│   │   ├── Admin/
│   │   │   └── AdminDashboard.tsx        # Admin dashboard
│   │   ├── Chat/
│   │   │   └── ChatBot.tsx               # AI chatbot
│   │   └── Layout/
│   │       └── Navbar.tsx                # Navigation bar
│   ├── contexts/
│   │   └── AuthContext.tsx         # Authentication context
│   ├── lib/
│   │   └── supabase.ts            # Supabase client
│   ├── types/
│   │   ├── database.ts            # Database types
│   │   └── index.ts               # App types
│   ├── App.tsx                    # Main app component
│   └── main.tsx                   # Entry point
├── supabase/
│   └── functions/
│       ├── process-prescription/   # OCR & AI analysis
│       ├── ai-chatbot/            # AI chatbot
│       └── get-doctors/           # Doctor listing
├── .env.example
├── README.md
└── SETUP_GUIDE.md
\`\`\`

## Database Schema

### user_profiles
- Stores extended user information
- Roles: patient, doctor, admin
- Links to Supabase auth.users

### prescriptions
- Stores prescription files and data
- OCR extracted text
- AI-generated summaries
- Medicine information

### appointments
- Patient-doctor appointments
- Status tracking
- Consultation notes

### medicine_reminders
- Automated medicine reminders
- Custom schedules
- Active/inactive status

### chat_history
- AI chatbot conversations
- User message history

## Security Implementation

### Row Level Security (RLS)

All tables have RLS enabled with policies:

**user_profiles:**
- Users can view/update their own profile
- Admins can view all profiles

**prescriptions:**
- Patients can view/manage their own prescriptions
- Doctors can view prescriptions for their patients
- Admins can view all prescriptions

**appointments:**
- Patients can view their appointments
- Doctors can view their appointments
- Both can update appointment status
- Admins have full access

**medicine_reminders:**
- Patients can manage their own reminders

**chat_history:**
- Users can view their own chat history

### Storage Security

Prescription files are stored in a private bucket with RLS policies:
- Users can only upload/view their own files
- Files are organized by user ID

## API Endpoints

### Edge Functions

All functions are accessible at:
\`\`\`
https://[your-project].supabase.co/functions/v1/[function-name]
\`\`\`

**Required Headers:**
\`\`\`javascript
{
  'Authorization': 'Bearer [SUPABASE_ANON_KEY]',
  'Content-Type': 'application/json'
}
\`\`\`

### process-prescription
- **Method:** POST
- **Body:** `{ imageUrl, prescriptionId }`
- **Response:** `{ extractedText, medicines, diagnosis, aiSummary }`

### ai-chatbot
- **Method:** POST
- **Body:** `{ message }`
- **Response:** `{ response }`

### get-doctors
- **Method:** GET
- **Query Params:** `?specialization=cardiology` (optional)
- **Response:** `{ doctors: [...] }`

## Design System

### Colors
- **Primary:** Blue (#3B82F6)
- **Secondary:** Green (#10B981)
- **Accent:** Gradient (Blue to Green)
- **Background:** Light gradients

### Components
- **Glassmorphism:** Frosted glass effect with backdrop-blur
- **Rounded:** Large border radius (xl, 2xl, 3xl)
- **Shadows:** Subtle shadows for depth
- **Gradients:** Blue-green gradients for buttons and accents

### Typography
- **Headings:** Bold, dark gray
- **Body:** Regular, medium gray
- **Labels:** Small, light gray

## Troubleshooting

### Common Issues

**1. Build Errors**
\`\`\`bash
npm install
npm run build
\`\`\`

**2. API Connection Issues**
- Check .env file exists
- Verify Supabase URL and key
- Ensure Edge Functions are deployed

**3. OCR Not Working**
- Verify Google Vision API is enabled
- Check API key is valid
- Ensure billing is enabled in Google Cloud

**4. AI Features Not Working**
- Verify Gemini API key
- Check API quota limits
- Review Edge Function logs

**5. Authentication Issues**
- Clear browser storage
- Check email confirmation settings
- Verify RLS policies

### Getting Help

**Check Logs:**
- Supabase Dashboard > Edge Functions > Logs
- Browser Console (F12)
- Network tab for API errors

**Database Access:**
- Supabase Dashboard > Table Editor
- SQL Editor for custom queries

## Performance Optimization

### Frontend
- Components are code-split
- Images should be optimized
- Lazy loading for routes

### Backend
- Database indexes on foreign keys
- RLS policies optimized
- Edge Functions use connection pooling

### Storage
- Compress images before upload
- Use appropriate file formats
- Set cache headers

## Deployment

The application is ready for deployment. Make sure to:

1. Set production environment variables
2. Enable HTTPS only
3. Configure CORS properly
4. Set up monitoring
5. Regular database backups

## Next Steps

1. **Customize Branding**
   - Update logo and colors
   - Modify text and labels
   - Add organization details

2. **Add Features**
   - SMS notifications
   - Email reminders
   - Report generation
   - Health records export

3. **Scale Infrastructure**
   - Monitor usage
   - Optimize queries
   - Add caching layer
   - Set up CDN

4. **Security Enhancements**
   - Enable 2FA
   - Add audit logging
   - Implement rate limiting
   - Regular security audits

## Support

For technical issues or questions:
- Review this guide
- Check the README.md
- Review code comments
- Check Supabase documentation

---

Happy building! 🏥
