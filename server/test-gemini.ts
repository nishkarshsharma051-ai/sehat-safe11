import { GoogleGenerativeAI } from "@google/generative-ai";
const apiKey = "AIzaSyDpVD4ak3AQczhEAW4EjJ3549iiE-UyLFQ"
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
(async () => {
    try {
        const result = await model.generateContent("hello");
        console.log("SUCCESS:", await result.response.text());
    } catch (e: any) {
        console.error("GEMINI ERROR:", e.message || e);
    }
})();
