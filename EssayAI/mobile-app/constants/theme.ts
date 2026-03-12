/**
 * Design system tokens for EssayAI mobile app.
 * Imported as "@/constants/theme" by all screens.
 */

import { Platform } from 'react-native';

export const Colors = {
  // Dark/Light mode legacy (kept for compatibility)
  light: {
    text: '#11181C',
    background: '#fff',
    tint: '#0a7ea4',
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: '#0a7ea4',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: '#fff',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#fff',
  },

  // ── App palette (used by all screens) ──────────────────────────
  text:          '#111827',
  textSecondary: '#4B5563',
  textMuted:     '#9CA3AF',
  background:    '#F6F8FB',
  surface:       '#FFFFFF',
  surfaceAlt:    '#F1F4F9',
  border:        '#E5EAF2',

  primary:       '#2563EB',
  primaryLight:  '#DBEAFE',

  success:       '#16A34A',
  successLight:  '#DCFCE7',

  warning:       '#F59E0B',
  warningLight:  '#FEF3C7',

  error:         '#EF4444',
  errorLight:    '#FEE2E2',

  info:          '#0EA5E9',
  infoLight:     '#E0F2FE',
};

export const Fonts = Platform.select({
  ios: {
    sans:    'system-ui',
    serif:   'ui-serif',
    rounded: 'ui-rounded',
    mono:    'ui-monospace',
  },
  default: {
    sans:    'normal',
    serif:   'serif',
    rounded: 'normal',
    mono:    'monospace',
  },
  web: {
    sans:    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif:   "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono:    "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const Spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  xxl:  32,
  xxxl: 40,
} as const;

export const Radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  full: 999,
} as const;

export const Typography = {
  heading1:  { fontSize: 28, fontWeight: '700' as const, color: '#111827' },
  heading2:  { fontSize: 22, fontWeight: '700' as const, color: '#111827' },
  heading3:  { fontSize: 18, fontWeight: '700' as const, color: '#111827' },
  body:      { fontSize: 15, color: '#111827' },
  bodySmall: { fontSize: 13, color: '#4B5563' },
  caption:   { fontSize: 12, color: '#9CA3AF' },
  label:     { fontSize: 11, color: '#9CA3AF', letterSpacing: 0.6 },
} as const;

export const Shadow = {
  sm: {
    shadowColor:   '#0F172A',
    shadowOpacity: 0.08,
    shadowOffset:  { width: 0, height: 2 },
    shadowRadius:  4,
    elevation:     2,
  },
  md: {
    shadowColor:   '#0F172A',
    shadowOpacity: 0.12,
    shadowOffset:  { width: 0, height: 6 },
    shadowRadius:  10,
    elevation:     4,
  },
} as const;
