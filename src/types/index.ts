export interface UserProfile {
  id: string;
  role: 'patient' | 'doctor' | 'admin';
  full_name: string;
  phone?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  specialization?: string;
  license_number?: string;
  hospital_name?: string;
  pin_code?: string;
  annual_income?: number;
  created_at?: string;
}

export interface Prescription {
  id: string;
  patient_id: string;
  doctor_id?: string;
  doctor_name?: string;
  file_url: string;
  extracted_text?: string;
  ai_summary?: string;
  medicines: Medicine[];
  diagnosis?: string;
  prescription_date?: string;
  created_at: string;
  category?: 'lab' | 'prescription' | 'scan' | 'discharge';
  tags?: string[];
  insurance_status?: 'covered' | 'not-covered' | 'pa-required';
  estimated_copay?: number;
  pa_required?: boolean;
}

export interface InsuranceCoverage {
  drugName: string;
  covered: boolean;
  tier: number;
  copay: number;
  paRequired: boolean;
  alternatives?: string[];
}

export interface DrugAlternative {
  name: string;
  reason: string;
  tier: number;
  estimatedCopay: number;
}

export interface PriorAuthorization {
  id: string;
  patientId: string;
  drugName: string;
  diagnosis: string;
  status: 'pending' | 'approved' | 'denied';
  clinicalJustification: string;
  submittedAt: string;
}

export interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
  duration?: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  reason: string;
  notes?: string;
  doctor?: UserProfile;
  patient?: UserProfile;
  rating?: number;
}

export interface MedicineReminder {
  id: string;
  patient_id: string;
  prescription_id?: string;
  medicine_name: string;
  dosage: string;
  frequency: string;
  start_date?: string;
  end_date?: string;
  reminder_times: string[];
  is_active: boolean;
  created_at?: string;
  taken_history?: TakenEntry[];
}

export interface TakenEntry {
  timestamp: string;
  taken: boolean;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  response: string;
  created_at: string;
}

export interface Doctor extends UserProfile {
  role: 'doctor';
  specialization: string;
  hospital_name?: string;
}

export interface HealthProfile {
  id: string;
  patient_id: string;
  age?: number;
  weight?: number;
  height?: number;
  blood_group?: string;
  bp_systolic?: number;
  bp_diastolic?: number;
  sugar_level?: number;
  allergies: string[];
  chronic_conditions: string[];
  emergency_contacts: EmergencyContact[];
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface HealthEntry {
  id: string;
  patient_id: string;
  date: string;
  type: 'test' | 'prescription' | 'surgery' | 'report' | 'vitals';
  title: string;
  description: string;
  values?: Record<string, number>;
  created_at: string;
}

export interface InsuranceRecord {
  id: string;
  patient_id: string;
  provider: string;
  policy_number: string;
  coverage_type: string;
  expiry_date: string;
  premium?: number;
  claims: InsuranceClaim[];
  created_at: string;
}

export interface InsuranceClaim {
  id: string;
  date: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  description: string;
}

export interface FamilyMember {
  id: string;
  parent_patient_id: string;
  name: string;
  relationship: string;
  age: number;
  profile_id: string;
}

export interface SecureShareLink {
  id: string;
  patient_id: string;
  token: string;
  expiry_hours: number;
  created_at: string;
  expires_at: string;
  revoked: boolean;
}

export interface HospitalFavorite {
  id: string;
  patient_id: string;
  name: string;
  address: string;
  phone: string;
  type: 'hospital' | 'clinic' | 'pharmacy';
  lat?: number;
  lng?: number;
}

export interface Scheme {
  id: string;
  name: string;
  description: string;
  eligibility: {
    minAge?: number;
    maxAge?: number;
    incomeLimit?: number;
    gender?: 'All' | 'Male' | 'Female';
    state?: string;
    chronicConditions?: string[];
  };
  benefits: string[];
  link: string;
  category: 'central' | 'state';
}

export interface PatientActivePlan {
  id: string;
  patientId: string;
  planId: string;
  planName: string;
  category: string;
  status: 'active' | 'completed';
  completedActivities: string[];
  startedAt: string;
  completedAt?: string;
}

export interface HealthPlan {
  id: string;
  name: string;
  description: string;
  duration: string;
  intensity: 'Low' | 'Moderate' | 'High';
  category: 'wellness' | 'medical' | 'rehabilitation';
  activities: PlanActivity[];
  recommendation_reason: string;
}

export interface PlanActivity {
  id: string;
  title: string;
  description: string;
  frequency: string;
  type: 'exercise' | 'diet' | 'checkup' | 'meditation' | 'wellness';
}
