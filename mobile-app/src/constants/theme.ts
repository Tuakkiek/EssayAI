/**
 * Design system tokens for EssayAI mobile app.
 * Imported as "@/constants/theme" by all screens.
 */

import { Platform, PlatformColor } from "react-native";

const systemColor = (name: string, fallback: string) =>
  Platform.OS === "ios" ? PlatformColor(name) : fallback;

export const Colors = {
  // Dark/Light mode legacy (kept for compatibility)
  light: {
    text: "#000000",
    background: "#FFFFFF",
    tint: "#007AFF",
    icon: "#8E8E93",
    tabIconDefault: "#8E8E93",
    tabIconSelected: "#000000",
  },
  dark: {
    text: "#FFFFFF",
    background: "#000000",
    tint: "#0A84FF",
    icon: "#8E8E93",
    tabIconDefault: "#8E8E93",
    tabIconSelected: "#FFFFFF",
  },

  // iOS system palette
  background: systemColor("systemBackground", "#FFFFFF"),
  secondaryBackground: systemColor("secondarySystemBackground", "#F2F2F7"),
  groupedBackground: systemColor("systemGroupedBackground", "#F2F2F7"),

  text: systemColor("label", "#000000"),
  textSecondary: systemColor("secondaryLabel", "#3C3C43"),
  textMuted: systemColor("tertiaryLabel", "#3C3C4399"),

  border: systemColor("separator", "#3C3C434A"),
  separator: systemColor("separator", "#3C3C434A"),

  tint: systemColor("systemBlue", "#007AFF"),
  destructive: systemColor("systemRed", "#FF3B30"),

  // Surfaces
  surface: systemColor("secondarySystemBackground", "#F2F2F7"),
  surfaceAlt: systemColor("systemBackground", "#FFFFFF"),

  // Semantic aliases used across the app
  primary: systemColor("label", "#000000"),
  primaryLight: systemColor("secondarySystemBackground", "#F2F2F7"),
  success: systemColor("systemBlue", "#007AFF"),
  successLight: systemColor("secondarySystemBackground", "#F2F2F7"),
  warning: systemColor("secondaryLabel", "#8E8E93"),
  warningLight: systemColor("secondarySystemBackground", "#F2F2F7"),
  error: systemColor("systemRed", "#FF3B30"),
  errorLight: systemColor("secondarySystemBackground", "#F2F2F7"),
  info: systemColor("systemBlue", "#007AFF"),
  infoLight: systemColor("secondarySystemBackground", "#F2F2F7"),
  onPrimary: systemColor("systemBackground", "#FFFFFF"),
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

export const Typography = {
  largeTitle: { fontSize: 34, fontWeight: "700" as const, color: Colors.text },
  heading1: { fontSize: 28, fontWeight: "700" as const, color: Colors.text },
  heading2: { fontSize: 22, fontWeight: "600" as const, color: Colors.text },
  heading3: { fontSize: 20, fontWeight: "600" as const, color: Colors.text },
  body: { fontSize: 17, color: Colors.text },
  bodySmall: { fontSize: 17, color: Colors.textSecondary },
  subhead: { fontSize: 17, color: Colors.textSecondary },
  caption: { fontSize: 12, color: Colors.textSecondary },
  label: { fontSize: 12, color: Colors.textSecondary, letterSpacing: 0.6 },
} as const;

export const Shadow = {
  sm: {
    shadowColor: "#000000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: "#000000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
  },
} as const;
