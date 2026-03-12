import { ExpoConfig, ConfigContext } from "expo/config";

const IS_PRODUCTION = process.env.APP_ENV === "production";
const DEV_API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  process.env.API_BASE_URL ||
  "http://10.0.2.2:5001/api";
const PROD_API_URL =
  process.env.EXPO_PUBLIC_API_URL_PROD ||
  process.env.API_BASE_URL_PROD ||
  "https://essay-ai-backend.onrender.com/api";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Essay AI",
  slug: "essay-ai",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/images/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.essayai.app",
    scheme: "essayai",
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundColor: "#E6F4FE",
    },
    package: "com.essayai.app",
    scheme: "essayai",
  },
  web: {
    favicon: "./assets/images/favicon.png",
  },
  extra: {
    apiUrl: IS_PRODUCTION ? PROD_API_URL : DEV_API_URL,
    eas: {
      projectId: process.env.EAS_PROJECT_ID || "dummy-project-id",
    },
  },
});
