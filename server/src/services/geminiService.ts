import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY!;
if (!apiKey) {
    console.error('GEMINI_API_KEY is not set in environment variables');
}

const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
        temperature: 0.8,
        topP: 0.9,
        maxOutputTokens: 300,
    },
});

const SYSTEM_PROMPT = `
You are Sehat Safe AI, a professional health assistant.

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

export const geminiService = {
    // Renamed to match controller's expectation (generateHealthResponse)
    async generateHealthResponse(userMessage: string, history: { role: string; parts: { text: string }[] }[] = [], userContext?: any) {
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

            const result = await model.generateContent(finalPrompt);
            const response = await result.response;
            return response.text();

        } catch (error) {
            console.error("Gemini Error:", error);
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

            const result = await model.generateContent(prompt);
            const response = await result.response;
            let text = response.text();
            text = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(text);
        } catch (error) {
            console.error('Error analyzing prescription text:', error);
            throw new Error('Failed to analyze prescription text');
        }
    }
};
