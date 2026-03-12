import Constants from "expo-constants"
import { Platform } from "react-native"

// Get API URL from app.config.ts extra section
export const API_BASE_URL =
  Constants.expoConfig?.extra?.apiUrl ??
  (Platform.OS === "android"
    ? "http://10.0.2.2:5000/api"
    : "http://localhost:5000/api")

// Root host (no /api) for endpoints that already include /api prefix
export const API_ROOT_URL = API_BASE_URL.replace(/\/api\/?$/, "")
