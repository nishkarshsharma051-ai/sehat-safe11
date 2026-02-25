import { API_BASE_URL } from '../config';

/**
 * Google Gemini AI Service
 * Provides real AI-powered health responses using the Gemini API
 * with retry logic and intelligent fallback to built-in knowledge base
 */



// ─── Built-in Health Knowledge Base (used when API is unavailable) ───
const HEALTH_KNOWLEDGE: Record<string, string> = {
    'headache|head pain|migraine': `**Headache Relief Guide**\n\n**Immediate Relief:**\n• Drink a full glass of water — dehydration is the #1 cause\n• Apply a cool compress to your forehead for 15 minutes\n• Rest in a quiet, dark room for 20-30 minutes\n• Gently massage your temples and neck\n\n**Medication:**\n• Paracetamol (500mg) or Ibuprofen (400mg)\n• Avoid taking painkillers more than 2-3 days/week\n\n**Prevention:**\n• Sleep 7-8 hours regularly\n• Stay hydrated (8-10 glasses/day)\n• Manage screen time — 20-20-20 rule\n• Regular meals — don't skip breakfast\n\n**See a doctor if:** Severe/sudden headache, vision changes, fever with stiff neck, or headaches worsening over weeks.\n\n*This is general guidance — consult your doctor for persistent symptoms.*`,

    'fever|temperature|bukhar': `**Fever Management**\n\n**Understanding Fever:**\n• Normal: 36.1-37.2°C (97-99°F)\n• Mild: 37.2-38.3°C — monitor & hydrate\n• Moderate: 38.3-39.4°C — medication needed\n• High: >39.4°C — seek medical help\n\n**Home Care:**\n• Drink plenty of fluids — water, ORS, coconut water\n• Light diet — khichdi, dal, fruits\n• Complete bed rest\n• Tepid sponging for comfort\n\n**Medication:**\n• Paracetamol 500mg every 4-6 hours (max 4g/day)\n• Do NOT alternate with Ibuprofen unless advised\n\n**Emergency signs:** Stiff neck, rash, difficulty breathing, confusion, fever >3 days\nCall **112** or visit nearest hospital immediately\n\n*Always consult a doctor for fevers lasting more than 3 days.*`,

    'cold|cough|flu|sneez|sore throat': `**Cold, Cough & Flu Care**\n\n**Home Remedies:**\n• Warm fluids — ginger-honey tea, haldi doodh, kadha\n• Steam inhalation with eucalyptus — 10 min, 2-3 times/day\n• Gargle warm salt water for sore throat\n• Honey with warm water soothes cough\n• Vitamin C — amla, oranges, guava\n\n**Ayurvedic Kadha Recipe:**\n• Boil: tulsi, ginger, black pepper, dalchini, clove\n• Add honey after cooling. Drink twice daily.\n\n**Medication:**\n• Antihistamine (Cetirizine 10mg) for runny nose\n• Cough syrup (for dry cough) or mucolytic (for wet cough)\n• Paracetamol for body aches\n\n**See a doctor if:** Symptoms >7 days, high fever, difficulty breathing, or chest pain.\n\n*Rest and hydration are your best friends!*`,

    'diabetes|sugar|blood sugar': `**Diabetes Management**\n\n**Target Blood Sugar Levels:**\n• Fasting: 80-130 mg/dL\n• 2 hours after meals: <180 mg/dL\n• HbA1c: <7%\n\n**Diet Tips:**\n• Choose complex carbs — roti over rice, millets over maida\n• Fill half your plate with vegetables\n• Avoid refined sugar, white rice, maida\n• Small, frequent meals (5-6 times/day)\n• Healthy snacks — nuts, sprouts, buttermilk\n\n**Lifestyle:**\n• 30-minute walk daily\n• Monitor blood sugar regularly\n• Take medications on time — never skip\n• Manage stress with yoga/meditation\n\n**Emergency:** Blood sugar >300 or <70 mg/dL — seek immediate medical help!\n\n*Regular check-ups every 3 months are essential.*`,

    'blood pressure|bp|hypertension': `**Blood Pressure Guide**\n\n**Know Your Numbers:**\n• Normal: <120/80 mmHg\n• Elevated: 120-129/<80\n• High Stage 1: 130-139/80-89\n• High Stage 2: ≥140/≥90\n\n**Management:**\n• Reduce salt (<5g/day) — avoid pickles, papad\n• Regular exercise — 30 min, 5 days/week\n• Maintain healthy BMI (18.5-24.9)\n• Quit smoking & limit alcohol\n• Yoga, pranayama & meditation\n\n**Diet (DASH Diet):**\n• Fruits, vegetables, whole grains\n• Low-fat dairy, lean proteins\n• Potassium-rich: bananas, spinach, sweet potato\n\nTake prescribed medications regularly — never stop without consulting doctor.\n\n**Emergency:** BP >180/120 — seek immediate medical care!\nCall **112** immediately.`,

    'stomach|digestion|acidity|gas|constipation': `**Digestive Health**\n\n**For Acidity & Gas:**\n• Eat slowly and chew food properly\n• Avoid spicy, oily, and fried foods\n• Don't lie down immediately after eating\n• Drink warm water after meals\n\n**Home Remedies:**\n• Jeera water — boil cumin seeds, drink warm\n• Ajwain water — for bloating and gas\n• Cold buttermilk with roasted cumin\n• Fennel seeds (saunf) after meals\n\n**For Constipation:**\n• Isabgol (psyllium husk) with warm milk\n• Increase fiber — papaya, prunes, vegetables\n• Drink 8-10 glasses of water daily\n• Morning walk or light exercise\n\n**Medication:**\n• Antacid (Gelusil/Digene) for quick relief\n• Probiotics for gut health\n\n**See a doctor if:** Persistent pain, blood in stool, unexplained weight loss, or symptoms >2 weeks.`,

    'sleep|insomnia|can\'t sleep|neend': `**Better Sleep Guide**\n\n**Sleep Hygiene Tips:**\n• Fixed schedule — same sleep/wake time daily\n• No screens 1 hour before bed\n• Keep room dark, cool (18-22°C), and quiet\n• No caffeine after 2 PM\n• Light dinner at least 2 hours before bed\n\n**Relaxation Techniques:**\n• 4-7-8 Breathing: Inhale 4s → Hold 7s → Exhale 8s\n• Progressive muscle relaxation\n• Calming music or white noise\n• Warm milk or chamomile tea before bed\n\n**Indian Remedies:**\n• Warm haldi doodh (turmeric milk)\n• Ashwagandha supplement (consult doctor first)\n• Brahmi tea\n\n**Consult a doctor if:** Insomnia >2 weeks, excessive daytime sleepiness, or loud snoring with breathing pauses.`,

    'stress|anxiety|mental health|depression|tension': `**Mental Health Support**\n\n**Coping Strategies:**\n• Deep breathing — 4-7-8 technique, 3 times/day\n• Regular exercise — 30 min daily (walk, yoga, swim)\n• Talk to trusted friends/family\n• Limit news & social media — set boundaries\n• Journaling — write down your thoughts daily\n\n**Relaxation:**\n• Meditation — start with 5 min daily\n• Listen to calming music\n• Spend time in nature\n• Creative activities — drawing, cooking, gardening\n\n**Professional Help:**\n• iCall: **9152987821**\n• Vandrevala Foundation: **1860-2662-345**\n• NIMHANS: **080-46110007**\n• Emergency: **112**\n\n*It's okay to not be okay. Asking for help is a sign of strength, not weakness. You are not alone.*`,

    'vitamin|supplement|nutrition': `**Essential Vitamins & Nutrition**\n\n**Key Vitamins for Indians:**\n• **Vitamin D:** 15 min sunlight daily, milk, eggs (70-80% Indians are deficient!)\n• **Vitamin B12:** Dairy, eggs, fortified foods (especially for vegetarians)\n• **Iron:** Spinach, jaggery, pomegranate, dates\n• **Vitamin C:** Amla, oranges, guava, lemon\n• **Calcium:** Milk, curd, ragi, sesame seeds\n\n**Daily Nutrition Plate:**\n• 50% vegetables & fruits\n• 25% protein (dal, paneer, eggs, chicken)\n• 25% grains (roti, rice, millets)\n\n**Superfoods:**\n• Moringa (drumstick leaves)\n• Turmeric (haldi)\n• Amla (Indian gooseberry)\n\nGet annual blood tests to check levels\n\n*Always consult a doctor before starting supplements — excess can be harmful too!*`,

    'exercise|workout|fitness': `**Exercise Guide**\n\n**Weekly Goals (WHO):**\n• 150 min moderate cardio (brisk walking, cycling)\n• OR 75 min vigorous cardio (running, swimming)\n• Strength training 2-3 times/week\n• Flexibility/stretching daily\n\n**Beginner-Friendly:**\n• Start with 15-min walks, gradually increase\n• Surya Namaskar — 12 rounds\n• Bodyweight: squats, push-ups, planks\n• Yoga for flexibility and stress\n\n**Indian Exercises:**\n• Surya Namaskar (full body)\n• Pranayama (breathing exercises)\n• Dand-Baithak (traditional Indian squats/push-ups)\n\n**Safety Tips:**\n• Always warm up (5 min) and cool down\n• Stay hydrated during exercise\n• Stop if you feel chest pain or dizziness\n\n*Consistency beats intensity — 20 min daily > 2 hours once a week!*`,

    'skin|acne|pimple|rash': `**Skin Care Tips**\n\n**Daily Routine:**\n• Cleanse face twice daily (gentle face wash)\n• Sunscreen SPF 30+ every day (even indoors!)\n• Moisturize — even if skin is oily\n• Don't pop pimples — causes scarring!\n\n**For Acne:**\n• Benzoyl peroxide (2.5%) or Salicylic acid wash\n• Clean pillowcases weekly\n• Reduce dairy and sugar intake\n• Stay hydrated — 8-10 glasses water daily\n\n**Natural Remedies:**\n• Aloe vera gel — soothing & healing\n• Neem face pack — antibacterial\n• Multani mitti — for oily skin\n• Rose water — natural toner\n\n**See a dermatologist if:** Severe/cystic acne, spreading rash, or signs of infection.\n\n*Consult a doctor before using prescription medications like isotretinoin.*`,

    'hello|hi|hey|namaste': `**Namaste! Welcome to Sehat Safe AI**\n\nI'm your AI-powered health assistant. I can help you with:\n\n• **Medication** information & guidance\n• **Symptom** assessment & tips\n• **Diet & Nutrition** — Indian diet plans\n• **Exercise** recommendations\n• **Mental Health** support & helplines\n• **Pregnancy** health tips\n• **Diabetes & BP** management\n• **Cold, Cough & Flu** remedies\n• **Skin Care** advice\n• **Vitamin & Supplement** guidance\n\n**Quick Tips:**\n• Ask specific questions for better answers\n• Describe symptoms in detail\n• Mention any existing conditions\n\n*I provide general health guidance — always consult a doctor for proper diagnosis and treatment.*\n\nHow can I help you today?`,

    'thank|thanks|dhanyavaad': `You're welcome! I'm glad I could help.\n\n**Stay Healthy Reminders:**\n• Drink enough water today\n• Eat your fruits and vegetables\n• Get some movement in\n• Sleep well tonight\n\n*Your health is your wealth! Don't hesitate to ask if you have more questions.*\n\nTake care!`,
};

/** Match user question against knowledge base with randomized responses */
async function getKnowledgeBaseResponse(question: string): Promise<string> {
    // Simulate AI thinking delay
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

    const q = question.toLowerCase();

    // Helper to pick random response
    const pick = (options: string[]) => options[Math.floor(Math.random() * options.length)];

    const intros = [
        `Here is what I found regarding "**${question}**":\n\n`,
        `Based on your query about "**${question}**", here is some guidance:\n\n`,
        `I can help you with that. Here is some information on "**${question}**":\n\n`,
    ];

    const outros = [
        `\n\n*Remember, this is general advice. Please consult a doctor for personalized care.*`,
        `\n\n*If symptoms persist, please book an appointment with our specialists.*`,
        `\n\n*Stay hydrated and take care!*`,
    ];

    for (const [keywords, response] of Object.entries(HEALTH_KNOWLEDGE)) {
        const patterns = keywords.split('|');
        if (patterns.some(p => q.includes(p))) {
            return pick(intros) + response + pick(outros);
        }
    }

    // Default response with variety
    const defaultResponses = [
        `I'm currently operating in **offline mode** and couldn't fetch a specific answer for "**${question}**".\n\nHowever, here are some general health tips:\n• Drink 8-10 glasses of water daily\n• Eat a balanced diet with fruits and vegetables\n• Exercise for at least 30 minutes daily\n• Get 7-8 hours of quality sleep\n\n**To get full AI responses:**\n1. Ensure you are connected to the internet\n2. Check if the Sehat Safe Server is running`,
        `I apologize, but I can't process that specific request right now. \n\n**While I reconnect to my AI brain, here is a quick health check:**\n- Have you drunk water in the last hour?\n- Are you sitting with good posture?\n- Have you taken a screen break recently?\n\n*Try asking about: Headache, Fever, Diabetes, or Diet.*`,
    ];

    return pick(defaultResponses) +
        `\n\nYou can also:\n- **Book an appointment** through our app\n- **Upload prescriptions** for analysis`;
}

/** Try Gemini API via Backend with retry, fallback to knowledge base */
export async function getGeminiResponse(
    userMessage: string,
    conversationHistory: { message: string; response: string }[] = [],
    userContext?: {
        name?: string;
        role?: string;
        age?: number;
        gender?: string;
        bloodGroup?: string;
        allergies?: string[];
        conditions?: string[];
        language?: 'English' | 'Hindi';
    }
): Promise<string> {

    // Transform history to match backend expectation if needed, or just pass as is
    // The backend expects: { role: string; parts: { text: string }[] }[]
    // But our controller takes 'history' directly. Let's adapt client history to backend format.
    const historyForBackend = conversationHistory.slice(-6).flatMap(entry => [
        { role: 'user', parts: [{ text: entry.message }] },
        { role: 'model', parts: [{ text: entry.response }] }
    ]);

    // Add language instruction if provided
    const languageInstruction = userContext?.language === 'Hindi'
        ? "Please respond in Hindi. "
        : "Please respond in English. ";

    const augmentedMessage = languageInstruction + userMessage;

    try {
        const response = await fetch(`${API_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: augmentedMessage,
                history: historyForBackend,
                userContext
            }),
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        return data.response;

    } catch (error) {
        console.warn('Backend API unavailable, using built-in knowledge base', error);
        return getKnowledgeBaseResponse(userMessage);
    }
}

/** Generate an AI health summary based on user's health profile data */
export async function getHealthSummary(profileData: {
    bloodGroup?: string;
    allergies?: string[];
    conditions?: string[];
    medications?: string[];
    age?: number;
}): Promise<string> {
    const prompt = `Based on this patient's health profile, provide a brief, personalized health summary with 3-4 key recommendations. Keep it concise (100-150 words).

Patient Profile:
        - Blood Group: ${profileData.bloodGroup || 'Not specified'}
        - Known Allergies: ${profileData.allergies?.join(', ') || 'None reported'}
        - Existing Conditions: ${profileData.conditions?.join(', ') || 'None reported'}
        - Current Medications: ${profileData.medications?.join(', ') || 'None reported'}
        - Age: ${profileData.age || 'Not specified'}

Provide actionable health insights and preventive care tips relevant to their profile.`;

    return getGeminiResponse(prompt);
}

/** Generate drug alternatives for Smart Prescribing Assistant */
export async function generateDrugAlternatives(
    drugName: string,
    patientCondition: string
): Promise<Array<{ name: string; reason: string; tier: number; estimatedCopay: number }>> {
    const prompt = `You are a clinical pharmacist AI. The patient needs an alternative to ${drugName} for the condition: ${patientCondition}.
Suggest 2-3 clinically equivalent, generic, or preferred-tier formularly alternatives that are typically cheaper or more likely to be covered by insurance.
Return the response STRICTLY as a JSON array of objects with the following keys:
- name (string)
- reason (string: brief clinical justification)
- tier (number: typically 1 or 2)
- estimatedCopay (number: estimated cost in dollars).
Do not include markdown formatting like \`\`\`json.`;

    try {
        const responseText = await getGeminiResponse(prompt);
        // Strip out any markdown code blocks if the model still includes them
        const cleaned = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
    } catch (err) {
        console.error('Failed to generate drug alternatives', err);
        return [];
    }
}

/** Generate Prior Authorization (PA) clinical justification */
export async function generatePriorAuthorization(
    drugName: string,
    diagnosis: string,
    patientProfile: any
): Promise<string> {
    const prompt = `You are an expert medical coder and physician assistant. Generate a strong clinical justification for a Prior Authorization (PA) request for the drug ${drugName} to treat ${diagnosis}.
Use the following patient profile data to support the medical necessity:
${JSON.stringify(patientProfile, null, 2)}

Provide a concise, formal medical justification (2-3 paragraphs) that explains why preferred alternatives have failed or are contraindicated, and why this specific medication is medically necessary. No markdown headers.`;


    return getGeminiResponse(prompt);
}

/** Simulate Grok NLP parsing unstructured texts, EMRs, and Wearables into structured events */
export async function extractHealthEventsFromSource(
    sourceData: string,
    sourceType: 'text' | 'photo' | 'wearable' | 'emr'
): Promise<any[]> {
    const prompt = `You are an advanced medical NLP engine (like Grok Health). Parse the following unstructured raw data coming from a ${sourceType} and extract all chronological health events.
Return the result STRICTLY as a JSON array of objects with these keys:
- date (ISO string, estimate if relative like "yesterday")
- title (Short, concise title of the event like "Reported Headache" or "Apple Watch BP Spike")
- description (1-2 sentences explaining the event or symptoms)
- category ('symptom', 'vitals', 'activity', 'medication', or 'diagnosis')
- ai_insight (A brief medical insight or warning flag if applicable, otherwise empty string)

Raw Data (${sourceType}):
"""
${sourceData}
"""

Ensure the output is valid JSON. Do not include markdown codeblocks (\`\`\`json).`;

    try {
        // Since we don't have a real backend chat completion setup passing arbitrary prompts easily without history formatting
        // Let's use getGeminiResponse (which right now proxies or falls back).
        // For the sake of the demo, we'll try to get it from the API.
        const responseText = await getGeminiResponse(prompt);
        let cleaned = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();

        // Handle potential parsing failures from raw AI output
        if (!cleaned.startsWith('[')) {
            // Trim until first bracket
            const bracketIndex = cleaned.indexOf('[');
            if (bracketIndex !== -1) cleaned = cleaned.substring(bracketIndex);
        }

        return JSON.parse(cleaned);
    } catch (err) {
        console.error('Failed to extract health events from source', err);
        // Return mock data fallback if API fails
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        return [
            {
                date: yesterday.toISOString(),
                title: `Parsed from ${sourceType}`,
                description: 'Failed to connect to AI parser, using mock extraction.',
                category: 'activity',
                ai_insight: 'AI Extraction offline.'
            }
        ];
    }
}
