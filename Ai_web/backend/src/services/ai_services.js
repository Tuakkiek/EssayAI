import { essayModel } from "../config/google-ai.config.js";

export const analyzeEssayContent = async (essayContent) => {
  const prompt = `
        You are an expert English academic examiner. 
        Analyze the following essay and return a structured JSON:
        {
          "score": { "overall": number, "grammar": number, "vocabulary": number },
          "feedback": { "strengths": string, "weaknesses": string },
          "corrections": [{ "original": string, "improvement": string, "reason": string }]
        }
        Essay: ${essayContent}
    `;

  try {
    const result = await essayModel.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error('--- AI SERVICE ERROR ---');
    console.error('Message:', error.message);
    if (error.status) console.error('Status:', error.status);
    if (error.errorDetails) console.error('Details:', JSON.stringify(error.errorDetails, null, 2));
    throw error;
  }
};
