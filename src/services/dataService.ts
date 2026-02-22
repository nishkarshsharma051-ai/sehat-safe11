// Backend-connected data service for Sehat Safe Health App
// Replaces localStorage with API calls

import {
    Prescription, Appointment, MedicineReminder, ChatMessage,
    Doctor, HealthProfile, HealthEntry, InsuranceRecord,
    FamilyMember, SecureShareLink, HospitalFavorite, UserProfile,
    Medicine
} from '../types';
import { API_BASE_URL } from '../config';

// Helper to get current user ID/Role from localStorage (set by AuthContext)
const getUser = () => {
    const stored = localStorage.getItem('backend_user');
    return stored ? JSON.parse(stored) : null;
};

const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

const mapPrescription = (p: any): Prescription => {
    let diagnosis = p.diagnosis || p.analysis;
    // If diagnosis is an object (from Gemini/analysis), try to extract the string
    if (diagnosis && typeof diagnosis === 'object') {
        diagnosis = (diagnosis as any).diagnosis || (diagnosis as any).summary || JSON.stringify(diagnosis);
    }

    return {
        id: p._id,
        patient_id: p.patientId?._id || p.patientId,
        doctor_id: p.doctorId?._id || p.doctorId,
        doctor_name: p.doctor_name || p.doctorId?.name,
        file_url: p.file_url || p.imageUrl || p.pdfUrl,
        extracted_text: p.extracted_text || p.extractedText,
        ai_summary: p.ai_summary || p.analysis,
        medicines: p.medicines || [],
        diagnosis: String(diagnosis || ''),
        prescription_date: p.prescription_date || p.date || p.createdAt,
        created_at: p.created_at || p.createdAt,
        category: p.category,
        tags: p.tags
    };
};

// ─── Users ────────────────────────────────────────
export const userService = {
    async getAll(): Promise<UserProfile[]> {
        // Not implemented on backend yet for general users list
        // Maybe return empty or mock if needed
        return [];
    },

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async getById(_id: string): Promise<UserProfile | undefined> {
        return undefined;
    },

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async add(_user: UserProfile) {
        // Backend handles registration
    },

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async update(_user: UserProfile) {
        // Backend update profile
    }
};

// ─── Prescriptions ────────────────────────────────

export const prescriptionService = {
    async getAll(patientId?: string): Promise<Prescription[]> {
        const user = getUser();
        if (!user) return [];

        const params = new URLSearchParams();
        // If a specific patientId is passed we're always fetching patient records,
        // so force role=patient regardless of the logged-in user's role (e.g. admin).
        // Normalize: admin viewing doctor dashboard should fetch as doctor
        const effectiveRole = patientId ? 'patient' : (user.role === 'admin' ? 'doctor' : (user.role || 'patient'));
        params.append('userId', patientId || user.uid);
        params.append('role', effectiveRole);
        if (patientId && patientId !== user.uid) params.append('patientId', patientId);

        const res = await fetch(`${API_BASE_URL}/api/prescriptions?${params.toString()}`, {
            headers: getAuthHeaders()
        });
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data) ? data.map(mapPrescription) : [];
    },

    async getAllGlobal(): Promise<Prescription[]> {
        // Only for admin?
        return this.getAll();
    },

    async getFiltered(patientId: string, filters: { category?: string; tag?: string; from?: string; to?: string }): Promise<Prescription[]> {
        const all = await this.getAll(patientId);
        let results = all;
        if (filters.category) results = results.filter(p => p.category === filters.category);
        if (filters.tag) results = results.filter(p => p.tags?.includes(filters.tag!));
        if (filters.from) results = results.filter(p => new Date(p.created_at) >= new Date(filters.from!));
        if (filters.to) results = results.filter(p => new Date(p.created_at) <= new Date(filters.to!));
        return results;
    },

    async add(prescription: Partial<Prescription> & { medicines?: Medicine[]; analysis?: Record<string, unknown>; extractedText?: string }) {
        // Use prescription parameter to avoid unused var warning
        console.log('Adding prescription:', prescription.patient_id);
        const user = getUser();
        await fetch(`${API_BASE_URL}/api/prescriptions`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                patientId: prescription.patient_id || user.uid,
                doctorId: prescription.doctor_id,
                medicines: prescription.medicines,
                analysis: prescription.analysis,
                extractedText: prescription.extractedText
            })
        });
    },

    async remove(id: string) {
        const res = await fetch(`${API_BASE_URL}/api/prescriptions/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Failed to delete prescription');
        }
    },
};

// ─── Patient Service ──────────────────────────────
export const patientService = {
    async getAll(): Promise<UserProfile[]> {
        const user = getUser();
        if (!user) return [];

        let url = `${API_BASE_URL}/api/patients`;
        if (user.role === 'doctor') {
            url = `${API_BASE_URL}/api/patients/doctor/${user.uid}`;
        }

        const res = await fetch(url, {
            headers: getAuthHeaders()
        });
        if (!res.ok) return [];

        const data = await res.json();
        // Map backend User to UserProfile if needed
        return data.map((u: { _id: string; role: string; name: string; email: string; createdAt: string }) => ({
            id: u._id,
            role: u.role,
            full_name: u.name,
            email: u.email,
            created_at: u.createdAt,
            // ... other fields
        }));
    },

    async addManual(patient: { full_name: string; phone?: string; gender?: string; age?: string }): Promise<UserProfile> {
        const res = await fetch(`${API_BASE_URL}/api/patients/manual`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(patient)
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Failed to register patient');
        }

        return res.json();
    }
};

// ─── Appointments ─────────────────────────────────
export const appointmentService = {
    async getByPatient(patientId: string): Promise<Appointment[]> {
        const res = await fetch(`${API_BASE_URL}/api/appointments?role=patient&userId=${patientId}`, {
            headers: getAuthHeaders()
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.appointments.map(mapAppointment);
    },

    async getByDoctor(doctorId?: string): Promise<Appointment[]> {
        const user = getUser();
        const id = doctorId || user?.uid;
        const res = await fetch(`${API_BASE_URL}/api/appointments?role=doctor&userId=${id}`, {
            headers: getAuthHeaders()
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.appointments.map(mapAppointment);
    },

    async getAll(): Promise<Appointment[]> {
        const user = getUser();
        if (!user) return [];
        const role = user.role || 'patient';
        // Admins viewing doctor dashboard should fetch as doctor
        if (role === 'doctor' || role === 'admin') return this.getByDoctor(user.uid);
        if (role === 'patient') return this.getByPatient(user.uid);
        return [];
    },

    async add(appointment: Partial<Appointment>) {
        await fetch(`${API_BASE_URL}/api/appointments`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                patientId: appointment.patient_id,
                doctorId: appointment.doctor_id,
                date: appointment.appointment_date?.split('T')[0],
                time: appointment.appointment_date?.split('T')[1] || '09:00',
                reason: appointment.reason
            })
        });
    },

    async updateStatus(id: string, status: string) {
        await fetch(`${API_BASE_URL}/api/appointments/${id}/status`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ status })
        });
    },

    async bulkUpdateStatus(ids: string[], status: string) {
        await fetch(`${API_BASE_URL}/api/appointments/bulk-status`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ ids, status })
        });
    },

    async addNotes(id: string, notes: string) {
        await fetch(`${API_BASE_URL}/api/appointments/${id}/status`, {
            method: 'PATCH', // Reusing the same endpoint as it now supports notes
            headers: getAuthHeaders(),
            body: JSON.stringify({ notes })
        });
    },

    async addRating(id: string, rating: number) {
        await fetch(`${API_BASE_URL}/api/appointments/${id}/status`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ rating })
        });
    },
};

// Helper to map backend appointment to frontend type
const mapAppointment = (a: any): Appointment => {
    const pId = a.patientId?._id || a.patientId;
    const dId = a.doctorId?._id || a.doctorId;

    return {
        id: String(a._id),
        patient_id: String(pId || ''),
        doctor_id: String(dId || ''),
        appointment_date: new Date(a.date).toISOString().split('T')[0] + 'T' + a.time, // Combine date and time
        status: a.status as Appointment['status'],
        reason: a.reason || 'No reason provided',
        notes: a.notes,
        rating: a.rating,
        doctor: a.doctorId && typeof a.doctorId === 'object' ? {
            id: String(a.doctorId._id),
            full_name: String(a.doctorId.name || 'Doctor'),
            specialization: 'General',
            hospital_name: 'Sehat Hospital',
            role: 'doctor'
        } : undefined,
        patient: a.patientId && typeof a.patientId === 'object' ? {
            id: String(a.patientId._id),
            full_name: String(a.patientId.name || 'Patient'),
            role: 'patient'
        } : undefined
    };
};


// ─── Doctors ──────────────────────────────────────
export const doctorService = {
    async getAll(): Promise<Doctor[]> {
        const res = await fetch(`${API_BASE_URL}/api/doctors`, {
            headers: getAuthHeaders()
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.doctors || [];
    },

    async getById(id: string): Promise<Doctor | null> {
        const res = await fetch(`${API_BASE_URL}/api/doctors/${id}`, {
            headers: getAuthHeaders()
        });
        if (!res.ok) return null;
        return res.json();
    },

    async completeProfile(profile: {
        specialization: string;
        qualifications: string;
        hospitalName: string;
        experience: number;
        availability: string;
        phone?: string;
    }): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/api/doctors/profile`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(profile)
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Failed to complete profile');
        }
        return res.json();
    }
};

// ─── Others (medicine reminders, basic local storage for now?) ───
// Use LocalStorage for features NOT yet on backend:
// Reminders, Chat, Health Profile, Entries, Insurance, Family, Share, Favorites
// Copying existing implementation for these.

const storage = {
    get: <T>(key: string): T[] => {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    },
    set: <T>(key: string, data: T[]): void => {
        localStorage.setItem(key, JSON.stringify(data));
    }
};

const KEYS = {
    REMINDERS: 'sehat_safe_reminders',
    CHAT_MESSAGES: 'sehat_safe_chat_messages',
    HEALTH_PROFILES: 'sehat_safe_health_profiles',
    HEALTH_ENTRIES: 'sehat_safe_health_entries',
    INSURANCE: 'sehat_safe_insurance',
    FAMILY: 'sehat_safe_family_members',
    SHARE_LINKS: 'sehat_safe_share_links',
    HOSPITAL_FAVORITES: 'sehat_safe_hospital_favorites',
};

export const reminderService = {
    async getAll(patientId: string): Promise<MedicineReminder[]> {
        const res = await fetch(`${API_BASE_URL}/api/reminders?patientId=${patientId}`, {
            headers: getAuthHeaders()
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.map((r: any) => ({
            id: r._id,
            patient_id: patientId,
            medicine_name: r.medicineName,
            dosage: r.dosage,
            reminder_times: r.reminderTimes || [],
            frequency: r.frequency,
            is_active: r.isActive,
            taken_history: r.takenHistory
        }));
    },
    async add(reminder: MedicineReminder) {
        await fetch(`${API_BASE_URL}/api/reminders`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                patientId: reminder.patient_id,
                medicineName: reminder.medicine_name,
                dosage: reminder.dosage,
                reminderTimes: reminder.reminder_times,
                frequency: reminder.frequency
            })
        });
    },
    async toggle(id: string) {
        await fetch(`${API_BASE_URL}/api/reminders/${id}/toggle`, {
            method: 'PATCH',
            headers: getAuthHeaders()
        });
    },
    async remove(id: string) {
        await fetch(`${API_BASE_URL}/api/reminders/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
    },
    async markTaken(id: string) {
        await fetch(`${API_BASE_URL}/api/reminders/${id}/taken`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
    },
    async getTakenHistory(id: string) {
        const all = storage.get<MedicineReminder>(KEYS.REMINDERS);
        const r = all.find(rem => rem.id === id);
        return r?.taken_history || [];
    },
};

export const chatService = {
    async getHistory(userId: string): Promise<ChatMessage[]> {
        const all = storage.get<ChatMessage>(KEYS.CHAT_MESSAGES);
        return all.filter(m => m.user_id === userId)
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    },

    async addMessage(msg: ChatMessage) {
        const all = storage.get<ChatMessage>(KEYS.CHAT_MESSAGES);
        storage.set(KEYS.CHAT_MESSAGES, [...all, msg]);
    },

    /** Simple AI health assistant responses (Built-in) */
    getAIResponse(question: string): string {
        const q = question.toLowerCase();

        if (q.includes('headache') || q.includes('head pain')) {
            return `** Headache Guidance:**\n\n• ** Stay hydrated ** — drink at least 8 glasses of water daily\n• ** Rest ** in a quiet, dark room for 20–30 minutes\n• ** Over - the - counter ** options: Paracetamol(500mg) or Ibuprofen(400mg) \n• ** Avoid ** screen time and bright lights during episodes\n\n ** See a doctor if:** headaches are severe, recurring daily, or accompanied by vision changes, nausea, or fever.\n\n * This is general guidance.Always consult your doctor for persistent symptoms.* `;
        }

        if (q.includes('fever') || q.includes('temperature')) {
            return `** Fever Management:**\n\n• ** Normal body temperature:** 36.1–37.2°C(97–99°F) \n• ** Mild fever(37.2–38.3°C):** Rest, hydrate, monitor\n• ** Moderate fever(38.3–39.4°C):** Take Paracetamol, cool compress\n• ** High fever(> 39.4°C):** Seek medical attention\n\n ** Medication:** Paracetamol 500mg every 4–6 hours(max 4g / day) \n\n ** Emergency signs:** Stiff neck, rash, difficulty breathing, confusion\n\n * Always consult a doctor for fevers lasting more than 3 days.* `;
        }

        if (q.includes('cold') || q.includes('cough') || q.includes('flu') || q.includes('sneez')) {
            return `** Common Cold / Flu Care:**\n\n• ** Rest ** as much as possible\n• ** Warm fluids:** Ginger tea with honey, warm water with lemon\n• ** Steam inhalation ** for 10 min, 2–3 times daily\n• ** Gargle ** with warm salt water for sore throat\n• ** Vitamin C ** rich foods: oranges, amla, guava\n\n ** OTC options:**\n - Antihistamine(Cetirizine 10mg) for runny nose\n - Cough syrup for dry cough\n - Paracetamol for body aches\n\n ** See a doctor if:** symptoms last > 7 days, high fever, or difficulty breathing.`;
        }

        if (q.includes('diabetes') || q.includes('sugar') || q.includes('blood sugar')) {
            return `** Diabetes Management Tips:**\n\n ** Target Blood Sugar Levels:**\n - Fasting: 80–130 mg / dL\n - 2 hours after meals: <180 mg / dL\n - HbA1c: <7%\n\n ** Diet:**\n - Eat complex carbs(whole grains, millets) \n - Avoid refined sugar and white rice\n - Include fiber - rich vegetables\n - Small, frequent meals\n\n ** Lifestyle:**\n - 30 min walk daily\n - Regular blood sugar monitoring\n - Take medications on time\n\n ** Emergency:** If blood sugar > 300 or < 70 mg / dL, seek immediate medical help.`;
        }

        if (q.includes('blood pressure') || q.includes('bp') || q.includes('hypertension')) {
            return `** Blood Pressure Guide:**\n\n ** Normal ranges:**\n - Normal: <120/80 mmHg\n- Elevated: 120–129/ < 80\n - High(Stage 1): 130–139 / 80–89\n - High(Stage 2): ≥140 /≥90\n\n ** Management:**\n - Reduce salt intake(<5g / day) \n - Regular exercise(30 min, 5 days / week) \n - Maintain healthy weight\n - Limit alcohol and quit smoking\n - Manage stress with yoga / meditation\n\n ** Medication:** Take prescribed medications regularly\n\n ** Emergency:** BP > 180 / 120 — seek immediate medical care.`;
        }

        if (q.includes('stomach') || q.includes('digestion') || q.includes('acidity') || q.includes('gas')) {
            return `** Digestive Health Tips:**\n\n ** For Acidity / Gas:**\n - Eat slowly and chew food properly\n - Avoid spicy, oily, and fried foods\n - Don't lie down immediately after eating\n- Drink warm water after meals\n- Try: Jeera water, ajwain water, or buttermilk\n\n**OTC options:**\n- Antacid (Gelusil/Digene) for acidity\n- Eno or baking soda for immediate relief\n- Probiotics for better gut health\n\n**See a doctor if:** persistent pain, blood in stool, unexplained weight loss.`;
        }

        if (q.includes('sleep') || q.includes('insomnia') || q.includes("can't sleep")) {
            return `**Sleep Hygiene Tips:**\n\n**Better Sleep Habits:**\n- Fixed sleep schedule (same time daily)\n- No screens 1 hour before bed\n- Keep room dark, cool, and quiet\n- Avoid caffeine after 2 PM\n- Warm milk or chamomile tea before bed\n\n**Relaxation:**\n- Deep breathing: 4-7-8 technique\n- Progressive muscle relaxation\n- Light stretching or yoga\n\n**Consult a doctor if:** insomnia lasts >2 weeks or you feel excessively sleepy during the day.`;
        }

        if (q.includes('stress') || q.includes('anxiety') || q.includes('mental health') || q.includes('depression')) {
            return `**Mental Health Support:**\n\n**Coping Strategies:**\n- Practice deep breathing (4-7-8 technique)\n- Regular physical exercise (30 min daily)\n- Maintain social connections\n- Limit news and social media exposure\n- Journaling — write down your thoughts\n\n**Relaxation Techniques:**\n- Meditation (start with 5 min daily)\n- Yoga or light stretching\n- Listen to calming music\n- Spend time in nature\n\n**Helplines:**\n- iCall: 9152987821\n- Vandrevala Foundation: 1860-2662-345\n- NIMHANS: 080-46110007\n\n*It's okay to ask for help. You are not alone.*`;
        }

        if (q.includes('vitamin') || q.includes('supplement') || q.includes('nutrition')) {
            return `**Essential Vitamins & Nutrition:**\n\n**Key Vitamins:**\n- **Vitamin D:** Sunlight (15 min daily), milk, eggs\n- **Vitamin B12:** Dairy, eggs, fortified foods\n- **Iron:** Spinach, jaggery, pomegranate\n- **Vitamin C:** Citrus fruits, amla, guava\n- **Calcium:** Milk, curd, ragi, sesame seeds\n\n**Common Deficiencies in India:**\n- Vitamin D (70–80% of Indians are deficient)\n- Iron (especially women)\n- B12 (especially vegetarians)\n\n**Recommendation:** Get annual blood tests to check levels\n\n*Always consult a doctor before starting supplements.*`;
        }

        if (q.includes('exercise') || q.includes('workout') || q.includes('fitness')) {
            return `**Exercise Recommendations:**\n\n**Weekly Goals:**\n- 150 min moderate cardio (brisk walking, cycling)\n- OR 75 min vigorous cardio (running, swimming)\n- Strength training 2–3 times/week\n- Flexibility exercises daily\n\n**Beginner-Friendly:**\n- Start with 15-min walks, increase gradually\n- Yoga and Surya Namaskar\n- Bodyweight exercises (squats, push-ups)\n\n**Safety:**\n- Warm up before and cool down after\n- Stay hydrated during exercise\n- Stop if you feel chest pain or dizziness\n\n*Consistency matters more than intensity!*`;
        }

        if (q.includes('diet') || q.includes('food') || q.includes('weight loss') || q.includes('eating')) {
            return `**Diet & Nutrition Guide:**\n\n**Balanced Indian Diet:**\n- **Breakfast:** Poha/Upma/Idli with fruits\n- **Lunch:** Dal, roti, sabzi, salad, curd\n- **Dinner:** Light — soup, khichdi, or grilled items\n- **Snacks:** Nuts, fruits, sprouts, buttermilk\n\n**Weight Management:**\n- Eat in smaller portions, 5-6 times a day\n- Avoid processed and packaged foods\n- Include protein in every meal\n- Drink warm water before meals\n\n**Avoid:** Crash diets, skipping meals, excessive sugar\n\n*Consult a dietician for personalized meal plans.*`;
        }

        if (q.includes('skin') || q.includes('acne') || q.includes('pimple') || q.includes('rash')) {
            return `**Skin Care Tips:**\n\n**Daily Routine:**\n- Cleanse face twice daily (gentle face wash)\n- Use sunscreen SPF 30+ daily\n- Moisturize even if skin is oily\n- Don't pop pimples!\n\n**For Acne:**\n- Benzoyl peroxide (2.5%) or Salicylic acid wash\n- Keep pillowcases clean\n- Stay hydrated\n- Reduce dairy and sugar intake\n\n**See a doctor if:** severe acne, spreading rash, or skin infection signs.\n\n*Consult a doctor before using prescription acne medications.*`;
        }

        if (q.includes('allergies') || q.includes('allergy') || q.includes('allergic')) {
            return `**Allergy Management:**\n\n**Common Allergens:**\n- Dust mites, pollen, pet dander\n- Certain foods (nuts, shellfish, dairy)\n- Medications (penicillin, aspirin)\n\n**Treatment:**\n- Antihistamines (Cetirizine, Fexofenadine)\n- Nasal corticosteroid sprays\n- Avoid known triggers\n- Keep home dust-free\n\n**Anaphylaxis signs (EMERGENCY):**\n- Difficulty breathing, throat swelling\n- Severe rash, dizziness, rapid pulse\n- **Call 112 or go to ER immediately**\n\n*Always carry prescribed emergency medication if you have severe allergies.*`;
        }

        if (q.includes('pregnancy') || q.includes('pregnant')) {
            return `**Pregnancy Health Tips:**\n\n**Essentials:**\n- Start folic acid (400mcg daily) before/during pregnancy\n- Regular prenatal checkups\n- Iron and calcium supplements as prescribed\n- Stay active with gentle exercise\n\n**Diet:**\n- Eat iron-rich foods (spinach, dates, jaggery)\n- Include protein, dairy, and fresh fruits\n- Avoid raw/undercooked food, alcohol, smoking\n\n**Warning signs — seek immediate help:**\n- Heavy bleeding or severe pain\n- Sudden swelling of face/hands\n- Reduced baby movement\n- High fever\n\n*Regular prenatal care is essential. Consult your OB-GYN.*`;
        }

        if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
            return `Hello! I'm your **Sehat Safe AI Health Assistant**.\n\nI can help you with:\n• **Medication** information\n• **Symptom** guidance\n• **Diet and nutrition** tips\n• **Exercise** recommendations\n• **Mental health** support\n• **General health** queries\n• **Allergy** management\n• **Pregnancy** health tips\n\nHow can I help you today?`;
        }

        if (q.includes('thank')) {
            return `You're welcome! Stay healthy and don't hesitate to ask if you have more questions.\n\n**Remember:** Regular checkups, balanced diet, and exercise are the pillars of good health!`;
        }

        // Default response
        return `Thank you for your question about: **"${question}"**\n\nHere are some general health tips:\n\n• Drink 8–10 glasses of water daily\n• Eat a balanced diet with fruits and vegetables\n• Exercise for at least 30 minutes daily\n• Get 7–8 hours of sleep\n• Practice stress management techniques\n\nFor specific medical concerns, I recommend:\n1. **Booking an appointment** with a specialist through our app\n2. **Uploading your prescription** for AI-powered analysis\n3. **Setting medicine reminders** to never miss a dose\n\n*This is general guidance. For specific symptoms or conditions, please consult a qualified healthcare professional.*`;
    },
};

// Restore full AI logic for chatService below...
// (I will paste the full AI logic in the actual tool call)

export const healthProfileService = {
    async get(patientId: string): Promise<HealthProfile | null> {
        const res = await fetch(`${API_BASE_URL}/api/health-data/profile?patientId=${patientId}`, {
            headers: getAuthHeaders()
        });
        if (!res.ok) return null;
        const p = await res.json();
        if (!p) return null;
        return {
            id: p._id,
            patient_id: patientId,
            age: p.age,
            weight: p.weight,
            height: p.height,
            blood_group: p.bloodGroup,
            bp_systolic: p.bpSystolic,
            bp_diastolic: p.bpDiastolic,
            sugar_level: p.sugarLevel,
            allergies: p.allergies || [],
            chronic_conditions: p.chronicConditions || [],
            emergency_contacts: p.emergencyContacts || []
        };
    },
    async save(profile: HealthProfile) {
        await fetch(`${API_BASE_URL}/api/health-data/profile`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                patientId: profile.patient_id,
                age: profile.age,
                weight: profile.weight,
                height: profile.height,
                bloodGroup: profile.blood_group,
                bpSystolic: profile.bp_systolic,
                bpDiastolic: profile.bp_diastolic,
                sugarLevel: profile.sugar_level,
                allergies: profile.allergies,
                chronicConditions: profile.chronic_conditions,
                emergencyContacts: profile.emergency_contacts
            })
        });
    },
};

export const healthEntryService = {
    async getAll(patientId: string): Promise<HealthEntry[]> {
        const res = await fetch(`${API_BASE_URL}/api/health-data/entries?patientId=${patientId}`, {
            headers: getAuthHeaders()
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.map((e: any) => ({
            id: e._id,
            patient_id: patientId,
            date: e.date,
            type: e.type,
            title: e.title,
            description: e.description,
            values: e.values,
            created_at: e.createdAt
        }));
    },
    async getByType(patientId: string, type: string): Promise<HealthEntry[]> {
        const res = await fetch(`${API_BASE_URL}/api/health-data/entries?patientId=${patientId}&type=${type}`, {
            headers: getAuthHeaders()
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.map((e: any) => ({
            id: e._id,
            patient_id: patientId,
            date: e.date,
            type: e.type,
            title: e.title,
            description: e.description,
            values: e.values,
            created_at: e.createdAt
        }));
    },
    async add(entry: HealthEntry) {
        await fetch(`${API_BASE_URL}/api/health-data/entries`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                patientId: entry.patient_id,
                date: entry.date,
                type: entry.type,
                title: entry.title,
                description: entry.description,
                values: entry.values
            })
        });
    },
    async remove(id: string) {
        await fetch(`${API_BASE_URL}/api/health-data/entries/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
    },
};

export const insuranceService = {
    async getAll(patientId: string): Promise<InsuranceRecord[]> {
        const res = await fetch(`${API_BASE_URL}/api/patient-data/insurance?patientId=${patientId}`, {
            headers: getAuthHeaders()
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.map((r: any) => ({
            id: r._id,
            patient_id: patientId,
            provider: r.provider,
            policy_number: r.policyNumber,
            coverage_type: r.coverageType,
            expiry_date: r.expiryDate,
            premium: r.premium,
            claims: r.claims || [],
            created_at: r.createdAt
        }));
    },
    async add(record: InsuranceRecord) {
        await fetch(`${API_BASE_URL}/api/patient-data/insurance`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                patientId: record.patient_id,
                provider: record.provider,
                policyNumber: record.policy_number,
                coverageType: record.coverage_type,
                expiryDate: record.expiry_date,
                premium: record.premium
            })
        });
    },
    async update(record: InsuranceRecord) {
        // Simple update: Add endpoint or handle via POST upsert if we change controller.
        // For now, let's keep it simple or implement specific PATCH if needed.
        await this.add(record);
    },
    async remove(id: string) {
        await fetch(`${API_BASE_URL}/api/patient-data/insurance/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
    },
    async addClaim(recordId: string, claim: InsuranceRecord['claims'][0]) {
        // Placeholder or implement nested claim support
        console.log('Claim addition not fully implemented on backend yet', recordId, claim);
    },
};

export const familyService = {
    async getAll(parentId: string): Promise<FamilyMember[]> {
        const res = await fetch(`${API_BASE_URL}/api/patient-data/family?parentId=${parentId}`, {
            headers: getAuthHeaders()
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.map((m: any) => ({
            id: m._id,
            parent_patient_id: parentId,
            name: m.name,
            relationship: m.relationship,
            age: m.age,
            profile_id: m.profileId
        }));
    },
    async add(member: FamilyMember) {
        await fetch(`${API_BASE_URL}/api/patient-data/family`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                parentId: member.parent_patient_id,
                name: member.name,
                relationship: member.relationship,
                age: member.age
            })
        });
    },
    async remove(id: string) {
        await fetch(`${API_BASE_URL}/api/patient-data/family/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
    },
};

export const secureShareService = {
    async getAll(patientId: string): Promise<SecureShareLink[]> {
        const all = storage.get<SecureShareLink>(KEYS.SHARE_LINKS);
        return all.filter(l => l.patient_id === patientId);
    },
    async create(patientId: string, expiryHours: number): Promise<SecureShareLink> {
        const now = new Date();
        const link: SecureShareLink = {
            id: Date.now().toString(),
            patient_id: patientId,
            token: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
            expiry_hours: expiryHours,
            created_at: now.toISOString(),
            expires_at: new Date(now.getTime() + expiryHours * 60 * 60 * 1000).toISOString(),
            revoked: false,
        };
        const all = storage.get<SecureShareLink>(KEYS.SHARE_LINKS);
        storage.set(KEYS.SHARE_LINKS, [...all, link]);
        return link;
    },
    async revoke(id: string) {
        const all = storage.get<SecureShareLink>(KEYS.SHARE_LINKS);
        storage.set(KEYS.SHARE_LINKS, all.map(l => l.id === id ? { ...l, revoked: true } : l));
    },
    async isValid(token: string): Promise<boolean> {
        const all = storage.get<SecureShareLink>(KEYS.SHARE_LINKS);
        const link = all.find(l => l.token === token);
        if (!link || link.revoked) return false;
        return new Date() < new Date(link.expires_at);
    },
};

export const hospitalFavoriteService = {
    async getAll(patientId: string): Promise<HospitalFavorite[]> {
        const res = await fetch(`${API_BASE_URL}/api/hospitals/favorites?patientId=${patientId}`, {
            headers: getAuthHeaders()
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.map((h: any) => ({
            id: h._id,
            patient_id: patientId,
            name: h.name,
            address: h.address,
            phone: h.phone,
            type: h.type,
            lat: h.lat,
            lng: h.lng
        }));
    },
    async add(hospital: HospitalFavorite) {
        await fetch(`${API_BASE_URL}/api/hospitals/favorites`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                patientId: hospital.patient_id,
                name: hospital.name,
                address: hospital.address,
                phone: hospital.phone,
                type: hospital.type,
                lat: hospital.lat,
                lng: hospital.lng
            })
        });
    },
    async remove(id: string) {
        await fetch(`${API_BASE_URL}/api/hospitals/favorites/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
    },
};

export const adminService = {
    async getStats(): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/api/admin/stats`, {
            headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error('Failed to fetch stats');
        return res.json();
    },

    async getAllUsers(): Promise<UserProfile[]> {
        const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
            headers: getAuthHeaders()
        });
        if (!res.ok) return [];
        return res.json();
    },

    async getAllAppointments(): Promise<Appointment[]> {
        const res = await fetch(`${API_BASE_URL}/api/admin/appointments`, {
            headers: getAuthHeaders()
        });
        if (!res.ok) return [];
        return res.json();
    },

    async getAllPrescriptions(): Promise<Prescription[]> {
        const res = await fetch(`${API_BASE_URL}/api/admin/prescriptions`, {
            headers: getAuthHeaders()
        });
        if (!res.ok) return [];
        return res.json();
    }
};
