/**
 * Design Token System — Essay AI
 * Spec: Motivating like a learning game, minimal like Apple products.
 * Color personality: Encouraging green, clean white, soft neutrals.
 */

export const Colors = {
  // ── Primary ──────────────────────────────────────────────────────
  primary:          "#58CC02",
  primaryDark:      "#46A302",
  primaryLight:     "#E9F9D6",
  primaryMuted:     "#C3EFA3",

  // ── Background & Surface ─────────────────────────────────────────
  background:       "#F7F7F7",
  surface:          "#FFFFFF",
  surfaceAlt:       "#F0F0F0",
  surfaceElevated:  "#FFFFFF",

  // ── Text ─────────────────────────────────────────────────────────
  text:             "#1D1D1F",
  textSecondary:    "#6E6E73",
  textMuted:        "#AEAEB2",
  textInverse:      "#FFFFFF",

  // ── Semantic ─────────────────────────────────────────────────────
  success:          "#58CC02",
  successLight:     "#E9F9D6",
  errorSoft:        "#FF6B6B",
  errorLight:       "#FFF0F0",
  warning:          "#FF9F0A",
  warningLight:     "#FFF4E0",
  info:             "#007AFF",
  infoLight:        "#EBF5FF",

  // ── UI elements ───────────────────────────────────────────────────
  border:           "#E5E5EA",
  separator:        "#E5E5EA",
  divider:          "#F2F2F7",
  overlay:          "rgba(0, 0, 0, 0.45)",
  shadow:           "#000000",

  // ── Score bands ───────────────────────────────────────────────────
  scoreLow:         "#FF6B6B",
  scoreMid:         "#FF9F0A",
  scoreHigh:        "#58CC02",
  scoreExcellent:   "#007AFF",

  // ── Tab bar ───────────────────────────────────────────────────────
  tabActive:        "#58CC02",
  tabInactive:      "#AEAEB2",
  tabBackground:    "#FFFFFF",

  // ── Onboarding / hero ─────────────────────────────────────────────
  heroGradientStart: "#58CC02",
  heroGradientEnd:   "#46A302",

  // ── Legacy aliases (backward compatibility) ───────────────────────
  tint:             "#58CC02",
  destructive:      "#FF6B6B",
  error:            "#FF6B6B",
  onPrimary:        "#FFFFFF",
  secondaryBackground: "#F0F0F0",
  groupedBackground:   "#F7F7F7",
  light: {
    text: "#1D1D1F",
    background: "#F7F7F7",
    tint: "#58CC02",
    icon: "#AEAEB2",
    tabIconDefault: "#AEAEB2",
    tabIconSelected: "#58CC02",
  },
  dark: {
    text: "#FFFFFF",
    background: "#000000",
    tint: "#58CC02",
    icon: "#AEAEB2",
    tabIconDefault: "#AEAEB2",
    tabIconSelected: "#58CC02",
  },
} as const;

export const Spacing = {
  xs:   4,
  sm:   8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 40,
  xxxl: 48,
} as const;

export const Radius = {
  xs:   8,
  sm:  12,
  md:  16,   // inputs
  lg:  18,   // buttons
  xl:  22,   // cards
  xxl: 24,   // modals
  full: 999,
} as const;

export const Typography = {
  // Display
  display:     { fontSize: 40, fontWeight: "800" as const, letterSpacing: -1.5 },
  largeTitle:  { fontSize: 32, fontWeight: "800" as const, letterSpacing: -1.2 },
  title1:      { fontSize: 26, fontWeight: "700" as const, letterSpacing: -0.8 },
  title2:      { fontSize: 22, fontWeight: "700" as const, letterSpacing: -0.5 },
  title3:      { fontSize: 18, fontWeight: "600" as const, letterSpacing: -0.3 },

  // Body
  body:        { fontSize: 16, fontWeight: "400" as const, letterSpacing: -0.1 },
  bodyMedium:  { fontSize: 16, fontWeight: "600" as const, letterSpacing: -0.1 },
  bodySmall:   { fontSize: 14, fontWeight: "400" as const, letterSpacing: 0 },
  caption:     { fontSize: 12, fontWeight: "500" as const, letterSpacing: 0.2 },
  label:       { fontSize: 11, fontWeight: "700" as const, letterSpacing: 0.8, textTransform: "uppercase" as const },

  // Score display
  scoreLarge:  { fontSize: 72, fontWeight: "900" as const, letterSpacing: -3 },
  scoreMedium: { fontSize: 40, fontWeight: "800" as const, letterSpacing: -2 },

  // Legacy aliases
  heading1:    { fontSize: 28, fontWeight: "700" as const },
  heading2:    { fontSize: 22, fontWeight: "600" as const },
  heading3:    { fontSize: 20, fontWeight: "600" as const },
  subhead:     { fontSize: 16, fontWeight: "400" as const },
} as const;

export const Shadow = {
  none: {},
  xs: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  green: {
    shadowColor: "#58CC02",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;

// ── Animation Timing Constants ────────────────────────────────────────────────
export const Timing = {
  buttonPress:   120,
  microFeedback: 150,
  standard:      200,
  reveal:        300,
  scoreCountUp:  900,  // 700–1200ms per spec
  shake:         150,
} as const;

// Legacy exports for backward compatibility
export const Fonts = {
  ios: { sans: "system-ui" },
  default: { sans: "normal" },
};
