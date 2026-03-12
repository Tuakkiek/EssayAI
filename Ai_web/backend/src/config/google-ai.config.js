import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

console.log('Gemini API Key loaded:', process.env.GEMINI_API_KEY ? 'YES (Starts with ' + process.env.GEMINI_API_KEY.substring(0, 7) + ')' : 'NO');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const essayModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: {
    responseMimeType: "application/json",
    temperature: 0.7,
  },
});
