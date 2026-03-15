/**
 * colors.ts — Liquid Glass Tab Bar color system
 */

export const LiquidColors = {
  // ── Brand ──────────────────────────────────────────────────────────────────
  primary:          "#58CC02",
  primaryDark:      "#46A302",

  // ── Glass surface ──────────────────────────────────────────────────────────
  glassBackground:  "rgba(255, 255, 255, 0.22)",
  glassBorder:      "rgba(255, 255, 255, 0.42)",
  glassBorderInner: "rgba(255, 255, 255, 0.18)",
  glassShimmer:     "rgba(255, 255, 255, 0.55)",
  glassShadow:      "rgba(0, 0, 0, 0.18)",

  // ── Indicator (liquid blob) ────────────────────────────────────────────────
  indicatorFill:        "rgba(255, 255, 255, 0.72)",
  indicatorBorder:      "rgba(255, 255, 255, 0.90)",
  indicatorShadow:      "rgba(88, 204, 2, 0.22)",
  indicatorGlow:        "rgba(255, 255, 255, 0.45)",

  // ── Icons ──────────────────────────────────────────────────────────────────
  iconActive:       "#1D1D1F",
  iconInactive:     "#6E6E73",
  iconActiveLabel:  "#58CC02",

  // ── Backdrop ──────────────────────────────────────────────────────────────
  backdropShadow:   "rgba(0, 0, 0, 0.12)",
} as const;

export type LiquidColorToken = keyof typeof LiquidColors;

// ── New Colors export (used by the modular Liquid Glass Tab Bar system) ──────
export const Colors = {
  // ── Brand ─────────────────────────────────────────────
  primary:            "#58CC02",
  primaryDark:        "#46A302",
  primaryGlow:        "rgba(88, 204, 2, 0.18)",

  // ── Glass surface ──────────────────────────────────────
  glassBackground:    "rgba(255, 255, 255, 0.25)",
  glassBorder:        "rgba(255, 255, 255, 0.45)",
  glassBorderInner:   "rgba(255, 255, 255, 0.20)",
  glassHighlight:     "rgba(255, 255, 255, 0.55)",
  glassTint:          "rgba(255, 255, 255, 0.12)",

  // ── Reflection gradient ────────────────────────────────
  reflectionTop:      "rgba(255, 255, 255, 0.35)",
  reflectionBottom:   "rgba(255, 255, 255, 0.00)",

  // ── Liquid blob ────────────────────────────────────────
  blobFill:           "rgba(255, 255, 255, 0.75)",
  blobBorder:         "rgba(255, 255, 255, 0.92)",
  blobSpecular:       "rgba(255, 255, 255, 0.60)",
  blobGlow:           "rgba(255, 255, 255, 0.30)",

  // ── Icons ──────────────────────────────────────────────
  iconActive:         "#1D1D1F",
  iconInactive:       "#6E6E73",

  // ── Shadows ────────────────────────────────────────────
  shadowDeep:         "rgba(0, 0, 0, 0.18)",
  shadowSoft:         "rgba(0, 0, 0, 0.10)",
  shadowGreen:        "rgba(88, 204, 2, 0.22)",
} as const;

export type ColorToken = keyof typeof Colors;
