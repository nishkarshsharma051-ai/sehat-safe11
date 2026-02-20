# Sehat Safe - Project Structure & Code Organization

## Complete File Structure

\`\`\`
sehat-safe/
├── src/
│   ├── components/              # React components
│   │   ├── Auth/               # Authentication components
│   │   │   ├── Login.tsx       # Login form with glassmorphism UI
│   │   │   └── Register.tsx    # Registration with role selection
│   │   │
│   │   ├── Patient/            # Patient-specific components
│   │   │   ├── PatientDashboard.tsx      # Main dashboard with overview
│   │   │   ├── PrescriptionUpload.tsx    # File upload with AI processing
│   │   │   ├── PrescriptionList.tsx      # View & manage prescriptions
│   │   │   ├── AppointmentBooking.tsx    # Book appointments with doctors
│   │   │   └── MedicineReminders.tsx     # Set & manage reminders
│   │   │
│   │   ├── Doctor/             # Doctor-specific components
│   │   │   └── DoctorDashboard.tsx       # Appointment management
│   │   │
│   │   ├── Admin/              # Admin-specific components
│   │   │   └── AdminDashboard.tsx        # System overview & management
│   │   │
│   │   ├── Chat/               # AI chatbot
│   │   │   └── ChatBot.tsx     # AI health assistant interface
│   │   │
│   │   └── Layout/             # Layout components
│   │       └── Navbar.tsx      # Top navigation bar
│   │
│   ├── contexts/               # React contexts
│   │   └── AuthContext.tsx     # Authentication state management
│   │
│   ├── lib/                    # Library configurations
│   │   └── supabase.ts        # Supabase client initialization
│   │
│   ├── types/                  # TypeScript definitions
│   │   ├── database.ts        # Supabase database types
│   │   └── index.ts           # Application types
│   │
│   ├── App.tsx                # Main application component
│   ├── main.tsx               # React entry point
│   ├── index.css              # Global styles (Tailwind)
│   └── vite-env.d.ts         # Vite type definitions
│
├── supabase/
│   └── functions/              # Edge Functions
│       ├── process-prescription/
│       │   └── index.ts       # OCR & AI analysis
│       ├── ai-chatbot/
│       │   └── index.ts       # AI health assistant
│       └── get-doctors/
│           └── index.ts       # Doctor listing API
│
├── public/                     # Static assets
├── dist/                       # Build output
│
├── .env.example               # Environment variables template
├── .gitignore                # Git ignore rules
├── eslint.config.js          # ESLint configuration
├── index.html                # HTML template
├── package.json              # Dependencies & scripts
├── postcss.config.js         # PostCSS configuration
├── tailwind.config.js        # Tailwind CSS configuration
├── tsconfig.json             # TypeScript configuration
├── tsconfig.app.json         # App TypeScript config
├── tsconfig.node.json        # Node TypeScript config
├── vite.config.ts            # Vite configuration
│
├── README.md                 # Project overview
├── SETUP_GUIDE.md           # Setup instructions
└── PROJECT_STRUCTURE.md     # This file
\`\`\`

## Component Architecture

### Authentication Flow

\`\`\`
App.tsx
└── AuthProvider
    └── AppContent
        ├── Login (if not authenticated)
        ├── Register (if not authenticated)
        └── Role-based Dashboard (if authenticated)
            ├── PatientDashboard (role: patient)
            ├── DoctorDashboard (role: doctor)
            └── AdminDashboard (role: admin)
\`\`\`

### Patient Dashboard Structure

\`\`\`
PatientDashboard
├── Navbar
├── Sidebar Navigation
└── Main Content Area
    ├── Overview (default view)
    │   ├── Statistics Cards
    │   └── Quick Actions
    ├── Prescriptions View
    │   ├── PrescriptionUpload
    │   └── PrescriptionList
    ├── Appointments View
    │   └── AppointmentBooking
    ├── Reminders View
    │   └── MedicineReminders
    └── Chat View
        └── ChatBot
\`\`\`

## Key Components Explained

### 1. AuthContext.tsx
**Purpose:** Manages authentication state across the app

**Features:**
- User session management
- Profile loading
- Sign in/up/out functions
- Real-time auth state updates

**Usage:**
\`\`\`typescript
const { user, profile, loading, signIn, signUp, signOut } = useAuth();
\`\`\`

### 2. Login.tsx & Register.tsx
**Purpose:** User authentication interfaces

**Features:**
- Glassmorphism design
- Form validation
- Error handling
- Role selection (in Register)
- Patient/Doctor specific fields

### 3. PatientDashboard.tsx
**Purpose:** Main patient interface

**Features:**
- Tab-based navigation
- Statistics overview
- Quick action buttons
- Integrated feature views

### 4. PrescriptionUpload.tsx
**Purpose:** Upload and process prescriptions

**Flow:**
1. User selects file
2. Upload to Supabase Storage
3. Create database entry
4. Call process-prescription Edge Function
5. Update with OCR & AI results
6. Display success message

### 5. PrescriptionList.tsx
**Purpose:** Display and manage prescriptions

**Features:**
- Grid layout with cards
- View details modal
- Delete functionality
- AI summary display
- Medicine information

### 6. AppointmentBooking.tsx
**Purpose:** Book and manage appointments

**Features:**
- Doctor search
- Date/time selection
- Appointment list
- Status indicators
- Booking form modal

### 7. MedicineReminders.tsx
**Purpose:** Medicine reminder management

**Features:**
- Add/edit/delete reminders
- Multiple reminder times
- Active/inactive toggle
- Date range selection

### 8. ChatBot.tsx
**Purpose:** AI health assistant

**Features:**
- Real-time chat interface
- Message history
- Auto-scroll
- Loading states
- Persistent history

### 9. DoctorDashboard.tsx
**Purpose:** Doctor appointment management

**Features:**
- Appointment list
- Status updates
- Add consultation notes
- Patient information

### 10. AdminDashboard.tsx
**Purpose:** System administration

**Features:**
- Statistics dashboard
- User management table
- Appointment oversight
- Prescription monitoring

## Database Integration

### Supabase Client Usage

**Query Pattern:**
\`\`\`typescript
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('column', value)
  .maybeSingle();
\`\`\`

**Insert Pattern:**
\`\`\`typescript
const { data, error } = await supabase
  .from('table_name')
  .insert({ ...data });
\`\`\`

**Update Pattern:**
\`\`\`typescript
const { error } = await supabase
  .from('table_name')
  .update({ ...updates })
  .eq('id', id);
\`\`\`

**Storage Upload:**
\`\`\`typescript
const { data, error } = await supabase.storage
  .from('bucket_name')
  .upload('file_path', file);
\`\`\`

## Edge Functions

### 1. process-prescription
**Location:** `supabase/functions/process-prescription/index.ts`

**Workflow:**
1. Receive image URL and prescription ID
2. Fetch image from Supabase Storage
3. Convert to base64
4. Send to Google Vision API for OCR
5. Extract text from response
6. Send text to Gemini AI for analysis
7. Parse AI response for medicines and diagnosis
8. Return structured data

**Input:**
\`\`\`json
{
  "imageUrl": "https://...",
  "prescriptionId": "uuid"
}
\`\`\`

**Output:**
\`\`\`json
{
  "extractedText": "...",
  "medicines": [{ "name": "...", "dosage": "...", "frequency": "..." }],
  "diagnosis": "...",
  "aiSummary": "..."
}
\`\`\`

### 2. ai-chatbot
**Location:** `supabase/functions/ai-chatbot/index.ts`

**Workflow:**
1. Receive user message
2. Construct system prompt with medical context
3. Send to Gemini AI
4. Return AI response

**Input:**
\`\`\`json
{
  "message": "What should I do for a headache?"
}
\`\`\`

**Output:**
\`\`\`json
{
  "response": "For a headache, you can try..."
}
\`\`\`

### 3. get-doctors
**Location:** `supabase/functions/get-doctors/index.ts`

**Workflow:**
1. Query user_profiles table
2. Filter by role = 'doctor'
3. Optional: filter by specialization
4. Return doctor list

**Query Params:**
- `specialization` (optional)

**Output:**
\`\`\`json
{
  "doctors": [
    {
      "id": "uuid",
      "full_name": "Dr. John Doe",
      "specialization": "Cardiology",
      "hospital_name": "City Hospital"
    }
  ]
}
\`\`\`

## State Management

### Local Component State
- Form inputs
- Modal visibility
- Loading states
- Error messages

### Context State (AuthContext)
- Current user
- User profile
- Authentication status
- Loading state

### Database State
- Real-time with Supabase subscriptions
- Manual refetch after mutations
- Optimistic updates where appropriate

## Styling System

### Tailwind CSS Classes

**Glassmorphism Effect:**
\`\`\`css
backdrop-blur-lg bg-white/70 border border-white/20 shadow-xl
\`\`\`

**Gradient Buttons:**
\`\`\`css
bg-gradient-to-r from-blue-500 to-green-500
\`\`\`

**Card Style:**
\`\`\`css
rounded-2xl p-6 border border-white/20 shadow-xl
\`\`\`

**Input Style:**
\`\`\`css
rounded-xl bg-white/50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200
\`\`\`

## Data Flow Examples

### Prescription Upload Flow
\`\`\`
User selects file
    ↓
Upload to Storage (Supabase)
    ↓
Create prescription record (database)
    ↓
Call process-prescription (Edge Function)
    ↓
Google Vision API (OCR)
    ↓
Gemini AI (Analysis)
    ↓
Update prescription record (database)
    ↓
Refresh UI with new data
\`\`\`

### Appointment Booking Flow
\`\`\`
User searches for doctor
    ↓
Call get-doctors (Edge Function)
    ↓
Display doctor list
    ↓
User fills booking form
    ↓
Create appointment record (database)
    ↓
Update UI with new appointment
\`\`\`

### AI Chat Flow
\`\`\`
User types message
    ↓
Display user message in UI
    ↓
Call ai-chatbot (Edge Function)
    ↓
Gemini AI processes message
    ↓
Display AI response in UI
    ↓
Save to chat_history (database)
\`\`\`

## Security Considerations

### Client-Side
- Never expose service role key
- Use anonymous key for client
- Validate user input
- Sanitize display data

### Database
- RLS policies on all tables
- User can only access own data
- Role-based access control
- Foreign key constraints

### Storage
- Private buckets
- User-based folder structure
- RLS on storage objects
- File type validation

### Edge Functions
- JWT verification enabled
- CORS properly configured
- Input validation
- Error handling

## Performance Optimization

### Frontend
- Code splitting by route
- Lazy loading components
- Memoization where needed
- Efficient re-renders

### Database
- Indexes on foreign keys
- Efficient query patterns
- maybeSingle() vs single()
- Limit result sets

### Storage
- Optimize images before upload
- Use appropriate formats
- CDN for static assets
- Cache headers

## Testing Recommendations

### Unit Tests
- Component rendering
- Function logic
- Type validation
- Error handling

### Integration Tests
- Authentication flow
- Database operations
- API calls
- File uploads

### E2E Tests
- Complete user journeys
- Role-based workflows
- Edge cases
- Error scenarios

## Development Workflow

### Local Development
\`\`\`bash
npm run dev        # Start dev server
npm run build      # Build for production
npm run lint       # Run linter
npm run preview    # Preview production build
\`\`\`

### Code Organization
- One component per file
- Logical folder structure
- Clear naming conventions
- Consistent formatting

### Git Workflow
- Feature branches
- Descriptive commits
- Pull request reviews
- Version tagging

## Extending the Application

### Adding New Features

1. **Create Component**
   - Add to appropriate folder
   - Follow existing patterns
   - Use TypeScript types

2. **Update Database**
   - Create migration
   - Add RLS policies
   - Update types

3. **Add Edge Function**
   - Create function folder
   - Implement logic
   - Deploy function

4. **Update UI**
   - Add to dashboard
   - Update navigation
   - Add to relevant views

### Adding New Roles

1. Update database types
2. Add RLS policies
3. Create dashboard component
4. Update App.tsx routing
5. Add role-specific features

### Customization

- **Colors:** Update tailwind.config.js
- **Fonts:** Add to index.css
- **Icons:** Import from lucide-react
- **Logo:** Update in components
- **Branding:** Update text strings

---

This structure provides a solid foundation for a production-ready healthcare application. All components follow React best practices and are designed for maintainability and scalability.
