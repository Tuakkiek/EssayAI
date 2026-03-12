/**
 * src/config/gemini.ts
 * Gemini AI client — singleton exported for use across services.
 */
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey =
  process.env.GOOGLE_AI_API_KEY ?? process.env.GEMINI_API_KEY ?? "";

if (!apiKey) {
  throw new Error("❌ Missing Gemini API key — set GOOGLE_AI_API_KEY in .env");
}

const modelName = process.env.GOOGLE_AI_MODEL ?? "gemini-1.5-flash";

console.info(
  `[Gemini] Key loaded: YES (starts with ${apiKey.substring(0, 10)}...)`,
);
console.info(`[Gemini] Model: ${modelName}`);

const genAI = new GoogleGenerativeAI(apiKey);

export const essayModel = genAI.getGenerativeModel({
  model: modelName,
  generationConfig: {
    responseMimeType: "application/json",
    temperature: 0.2, // low = consistent scoring
  },
});
