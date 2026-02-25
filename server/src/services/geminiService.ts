import Groq from "groq-sdk";
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GROQ_API_KEY!;
if (!apiKey) {
    console.error('GROQ_API_KEY is not set in environment variables');
}

const groq = new Groq({ apiKey });

const SYSTEM_PROMPT = `
You are Sehat Safe AI, a professional health assistant.

You MUST ONLY answer questions related to medical health, wellness, symptoms, medications, and general healthcare.
If the user asks a question that is NOT related to health or medicine (e.g., general knowledge, politics, sports, entertainment, or irrelevant tasks), politely inform them that you are a dedicated medical assistant and can only assist with health-related queries.
Do not engage in off-topic conversations.

Answer the user's question naturally and directly.
Be helpful, concise, and specific.
Avoid repeating generic advice unless relevant.
Do not introduce app features unless asked.
Keep responses under 150 words unless it is an emergency.
If the question is about a medical emergency, prioritize immediate actionable steps.
Maintain a professional and calm tone.
`;

const greetings = ["hi", "hello", "hey", "namaste"];

const emergencyKeywords = [
    "heart attack",
    "stroke",
    "bleeding",
    "chest pain",
    "unconscious",
    "breathing problem",
];

interface UserContext {
    name: string;
    role: string;
    age?: number | string;
    gender?: string;
    allergies?: string[];
    conditions?: string[];
}

export const geminiService = {
    // Keep name geminiService to avoid breaking imports in the backend
    async generateHealthResponse(userMessage: string, userContext?: UserContext) {
        try {
            const message = userMessage.trim().toLowerCase();

            // Simple greeting handler
            if (greetings.includes(message)) {
                return "Hello! How can I help you with your health question today?";
            }

            // Emergency detection
            const isEmergency = emergencyKeywords.some(keyword =>
                message.includes(keyword)
            );

            let contextString = "";
            if (userContext) {
                contextString = `\nUser Context: Name: ${userContext.name}, Role: ${userContext.role}`;
                if (userContext.age) contextString += `, Age: ${userContext.age}`;
                if (userContext.gender) contextString += `, Gender: ${userContext.gender}`;
                if (userContext.allergies && userContext.allergies.length > 0) contextString += `, Allergies: ${userContext.allergies.join(", ")}`;
                if (userContext.conditions && userContext.conditions.length > 0) contextString += `, Conditions: ${userContext.conditions.join(", ")}`;
            }

            const finalPrompt = `
${SYSTEM_PROMPT}
${contextString}

User Question:
${userMessage}

${isEmergency ? "If this is potentially serious, advise seeking immediate medical help." : ""}
`;

            const completion = await groq.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: finalPrompt
                    }
                ],
                model: "llama-3.1-8b-instant",
                temperature: 0.8,
                max_tokens: 300,
                top_p: 0.9,
            });

            return completion.choices[0]?.message?.content || "No response received.";

        } catch (error) {
            console.error("Groq Error:", error);
            return "I'm having trouble processing your request right now. Please try again.";
        }
    },

    async analyzePrescriptionText(extractedText: string) {
        try {
            const prompt = `Analyze the following text extracted from a medical prescription: "${extractedText}"
    
          Please extract the following information and format it as a JSON object:
          1. Doctor's Name
          2. Diagnosis
          3. Medicines (list of objects with name, dosage, frequency, duration)
          4. Date
          
          Return ONLY the JSON string. Ensure the keys are "Doctor Name", "Diagnosis", "Medicines", "Date".`;

            const completion = await groq.chat.completions.create({
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                model: "llama-3.1-8b-instant",
                temperature: 0.1,
            });

            let text = completion.choices[0]?.message?.content || "";
            text = text.replace(/```json/g, '').replace(/```/g, '').trim();
            // sometimes the model will return extra text outside JSON
            if (text.indexOf('{') > -1 && text.lastIndexOf('}') > -1) {
                text = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
            }
            return JSON.parse(text);
        } catch (error) {
            console.error('Error analyzing prescription text with Groq:', error);
            throw new Error('Failed to analyze prescription text');
        }
    },

    async extractMedicalRecord(extractedText: string) {
        try {
            const prompt = `Analyze the following text extracted from a medical document: "${extractedText}"
    
          Categorize the document and extract relevant metrics. Format it STRICTLY as a JSON object with these keys:
          - "type": MUST be one of: "test", "prescription", "surgery", "report", "vitals"
          - "title": A short descriptive title (e.g., "Complete Blood Count", "Discharge Summary")
          - "date": The date of the record (YYYY-MM-DD) or current date if none found
          - "description": A 1-2 sentence summary of the findings or contents
          - "values": An object of key numerical metrics extracted (e.g., {"sugar_level": 120, "bp_systolic": 130}). Only include valid numbers.
          
          Return ONLY the raw JSON string. Ensure there are no markdown formatting tags like \`\`\`json.`;

            const completion = await groq.chat.completions.create({
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                model: "llama-3.1-8b-instant",
                temperature: 0.1,
            });

            let text = completion.choices[0]?.message?.content || "";
            text = text.replace(/```json/g, '').replace(/```/g, '').trim();
            if (text.indexOf('{') > -1 && text.lastIndexOf('}') > -1) {
                text = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
            }
            return JSON.parse(text);
        } catch (error) {
            console.error('Error extracting medical record with Groq:', error);
            throw new Error('Failed to analyze medical document');
        }
    }
};
