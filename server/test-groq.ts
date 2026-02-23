import { geminiService } from "./src/services/geminiService";
(async () => {
    try {
        console.log("TESTING GROQ SUMMARY...");
        const response = await geminiService.generateHealthResponse(`You are an expert clinical AI assistant. Summarize the following patient's clinical status in 2-3 short sentences.
Name: Rahul Sharma
Age: 45
Chronic Conditions: None reported
Recent Vitals: BP 120/80 mmHg, Sugar 100 mg/dL

Recent Visits: 2023-10-12 (Followup)
Recent Meds: None

Format requirements: No markdown headers. Provide a brief objective summary paragraph, followed by a second paragraph starting with "**Recommendation:**" highlighting any action the doctor should take immediately based on the provided data. Make it sound extremely professional, just like a true medical record summary.`);
        console.log("RESPONSE:", response);
    } catch (e: any) {
        console.error("ERROR:", e);
    }
})();
