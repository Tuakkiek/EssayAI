import Constants from "expo-constants"

// Get API URL from app.config.ts extra section
export const API_BASE_URL =
  Constants.expoConfig?.extra?.apiUrl ?? "http://10.0.2.2:5000/api"
