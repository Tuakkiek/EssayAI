# Essay AI Platform

Essay AI is a full-stack platform designed to provide automated, AI-driven band scoring and feedback for IELTS Task 1 and Task 2 essays.

It features a robust Node.js backend utilizing Mistral-7B via Together AI for high-quality grading, with comprehensive history tracking, teacher dashboards, vocabulary/grammar improvements, and payment processing for premium subscriptions through Sepay. The mobile client is built using React Native / Expo, providing an intuitive, polished interface.

## Project Structure

- `/backend-api` - Node.js Express server, MongoDB models, Sepay webhook integration, and Together AI communication layer. Built with strictly-typed TypeScript.
- `/mobile-app` - React Native mobile application, utilizing Expo Router with deep-linking, animated UI elements, and a centralized `api.ts` client.
- `/docs` - System architecture documentation.

## Running Locally

### 1. Start the Backend
```bash
cd backend-api
npm install
# Ensure you have .env configured with MONGODB_URI, TOGETHER_API_KEY, etc.
npm run dev
```

### 2. Start the Mobile Client
```bash
cd mobile-app
npm install
npm start
# Press 'a' to open in Android Emulator, 'i' for iOS Simulator
```

## Features

*   **Accurate IELTS Scoring:** Leverages Mistral Instruct 7B, locked to JSON schema output, mapping to official IELTS rubrics.
*   **Teacher & Center Management:** Admin and Teacher roles, with views tracking student progress over time.
*   **Deep Improvement Insights:** AI-driven text rewriting, vocabulary enhancement, and grammatical rule explanation.
