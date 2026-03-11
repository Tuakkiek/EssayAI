# Production Deployment Guide

This document outlines the zero-downtime deployment strategy for the Essay AI platform, covering the Node.js backend on Render and the React Native application via Expo Application Services (EAS).

## 1. Backend Deployment (Render.com)

We rely on **Render Web Services** utilizing Docker.

### Pipeline

We have configured a GitHub Actions pipeline (`.github/workflows/ci.yml`) that automates type checking and testing. When the `main` branch is pushed, it sends a webhook to Render to trigger a deployment.

### Render Service Setup

1. Create a **New Web Service** and connect the GitHub repository.
2. Build Filter: Set to `backend-api/**` so it only builds when backend code changes.
3. Environment: **Docker**.
4. Root Directory: `backend-api`.
5. Pre-deploy command: Not needed, Dockerfile handles the build stages.
6. Start Command: Handled by Docker `CMD`.

### Environment Variables on Render
Set the following secrets in your Render dashboard:

- `NODE_ENV=production`
- `PORT=5000`
- `MONGODB_URI`
- `TOGETHER_API_KEY`
- `JWT_SECRET`
- `SEPAY_API_TOKEN` & `SEPAY_WEBHOOK_SECRET`
- `CLOUDINARY_URL`

## 2. CI/CD: GitHub Actions
The `.github/workflows/ci.yml` requires two secrets to trigger automated deployments post-testing:
- `RENDER_API_KEY`: A personal access token generated in Render.
- `RENDER_SERVICE_ID`: The specific ID of your web service, e.g. `srv-cxxxxxxxxx`.

## 3. Mobile App Build (Expo EAS)

The React Native application is built and distributed using Expo Application Services (EAS).

### Build Configurations (`eas.json`)
The `eas.json` file dictates how different environments are built.

- **development**: Internal distribution, uses the `.apk` / `.ipa` development client.
- **preview**: Internal distribution, builds exactly how production would but for internal testing via Expo Go or direct app installs.
- **production**: Builds the final `.aab` for Android and `.ipa` for iOS. It utilizes auto-incrementing build numbers.

### Triggering a Build

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```
2. **Login to Expo:**
   ```bash
   eas login
   ```
3. **Trigger Cloud Build:**
   ```bash
   # Android Play Store Bundle
   eas build --platform android --profile production
   
   # iOS App Store Build
   eas build --platform ios --profile production
   ```

### Publishing Over-The-Air (OTA) Updates
For minor JS or asset changes that don't require native code updates:
```bash
eas update --branch production --message "Fix styling bug on results screen"
```
Users will download this update on their next app start.
