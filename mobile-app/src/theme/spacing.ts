/**
 * theme/spacing.ts
 */
import { Platform, Dimensions } from "react-native";

const { width: SCREEN_W } = Dimensions.get("window");

export const Spacing = {
  // ── Grid ──────────────────────────────────────────────
  xs:    4,
  sm:    8,
  md:   16,
  lg:   24,
  xl:   32,
  xxl:  48,

  // ── Tab bar geometry ───────────────────────────────────
  barHeight:        74,
  barHorizontalGap: 18,          // inset from screen edge
  barCornerRadius:  30,
  barBottomOffset:  Platform.OS === "ios" ? 28 : 16,

  // ── Blob ──────────────────────────────────────────────
  blobRadius:       26,           // resting radius
  blobRadiusX:      26,           // base horizontal radius
  blobRadiusY:      26,           // base vertical radius

  // ── Icons ─────────────────────────────────────────────
  iconSize:         24,
  iconStroke:       2.25,
  tabMinWidth:      44,           // accessibility tap target

  // ── Derived ───────────────────────────────────────────
  barWidth:         SCREEN_W - 18 * 2,
} as const;
