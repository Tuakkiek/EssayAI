# Essay AI Platform — Architecture

## System Overview

```
Mobile App (React Native Expo)
        |
      REST API (HTTPS)
        |
  NodeJS Backend (Express + TypeScript)
        |
  ┌─────┼──────────┬──────────┐
  │     │          │          │
MongoDB  Cloudinary  Together AI  Sepay
```

## Components

### 1. Mobile App — `mobile-app/`
- **Framework:** React Native + Expo
- **Purpose:** Student-facing interface
- **Responsibilities:**
  - Essay input UI
  - Display AI scores and corrections
  - History and progress tracking
  - Payment / subscription flow

### 2. Backend API — `backend-api/`
- **Runtime:** Node.js + Express + TypeScript
- **Port:** 5000
- **Responsibilities:**
  - REST API for mobile client
  - Business logic
  - Auth & authorization
  - Orchestrates all external services

### 3. External Services

| Service | Purpose |
|---------|---------|
| **MongoDB Atlas** | Persist users, essays, scores |
| **Cloudinary** | Store file uploads (avatars, attachments) |
| **Together AI** | AI essay scoring via Mistral-7B |
| **Sepay** | Vietnamese payment gateway |

## API Modules (planned)

```
/auth         → register, login, token refresh
/essay        → submit, score, history
/user         → profile, avatar upload
/subscription → plans, payment, webhook
/admin        → teacher dashboard
```

## Data Flow

```
1. Student writes essay in mobile app
2. App POSTs essay text to /essay/score
3. Backend forwards essay to Together AI (Mistral-7B)
4. AI returns JSON: { score, grammar_errors, suggestions }
5. Backend saves result to MongoDB
6. Mobile displays score + corrections
```

## Environment Variables

See `backend-api/.env.example` for required config.
