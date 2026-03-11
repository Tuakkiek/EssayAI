# Essay AI Platform

AI-powered IELTS essay scoring platform for Vietnamese students.

## Monorepo Structure

```
essay-ai-platform/
├── backend-api/     # Node.js + Express + TypeScript
├── mobile-app/      # React Native + Expo
└── docs/            # Architecture & planning docs
```

## Quick Start

### Backend
```bash
cd backend-api
cp .env.example .env   # fill in your credentials
npm install
npm run dev            # starts on port 5000
```

### Mobile App
```bash
cd mobile-app
npx create-expo-app .
npm install axios
npx expo start
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native + Expo |
| Backend | Node.js + Express + TypeScript |
| Database | MongoDB Atlas |
| AI | Together AI (Mistral-7B) |
| Files | Cloudinary |
| Payments | Sepay |

## Docs
- [Architecture](./docs/ARCHITECTURE.md)
