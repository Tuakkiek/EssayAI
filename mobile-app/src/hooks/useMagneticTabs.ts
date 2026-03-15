/**
 * hooks/useMagneticTabs.ts
 *
 * Magnetic icon interaction system.
 * Each tab has a lift (translateY) and scale value.
 *
 * When a tab is activated:
 *  - Icon springs UP by -6px (magnetic lift)
 *  - Icon scales 1 → 1.12 → 1.0 (pulse)
 *  - All other icons spring back to neutral
 *
 * When tab changes:
 *  - Previous icon snaps back to neutral
 *  - New icon performs lift + pulse sequence
 */

import { useCallback } from "react";
import {
  useSharedValue,
  withSpring,
  withSequence,
} from "react-native-reanimated";

// ── Spring configs ─────────────────────────────────────────────────────────
const LIFT_SPRING = {
  stiffness: 300,
  damping:   18,
  mass:      0.65,
} as const;

const PULSE_SPRING = {
  stiffness: 380,
  damping:   16,
  mass:      0.55,
} as const;

const RETURN_SPRING = {
  stiffness: 260,
  damping:   22,
  mass:      0.7,
} as const;

// ── Magnetic parameters ────────────────────────────────────────────────────
const LIFT_Y     = -6;   // px upward when active (spec: -6)
const PEAK_SCALE = 1.12; // brief scale peak (spec: 1.12)

// ── Types ──────────────────────────────────────────────────────────────────
export interface MagneticTabState {
  lifts:  ReturnType<typeof useSharedValue<number>>[];
  scales: ReturnType<typeof useSharedValue<number>>[];
  activateTab: (index: number) => void;
}

export function useMagneticTabs(tabCount: number): MagneticTabState {
  // Allocate shared values statically (React hooks rules)
  const l0 = useSharedValue(0);
  const l1 = useSharedValue(0);
  const l2 = useSharedValue(0);
  const l3 = useSharedValue(0);
  const l4 = useSharedValue(0);

  const s0 = useSharedValue(1);
  const s1 = useSharedValue(1);
  const s2 = useSharedValue(1);
  const s3 = useSharedValue(1);
  const s4 = useSharedValue(1);

  const lifts  = [l0, l1, l2, l3, l4].slice(0, tabCount);
  const scales = [s0, s1, s2, s3, s4].slice(0, tabCount);

  const activateTab = useCallback((index: number) => {
    "worklet";

    for (let i = 0; i < tabCount; i++) {
      if (i === index) {
        // ── Active tab: lift + pulse ───────────────────────────────────────
        lifts[i].value = withSpring(LIFT_Y, LIFT_SPRING);

        scales[i].value = withSequence(
          withSpring(PEAK_SCALE, PULSE_SPRING),
          withSpring(1.0, RETURN_SPRING),
        );
      } else {
        // ── Inactive tabs: return to neutral ──────────────────────────────
        lifts[i].value  = withSpring(0, RETURN_SPRING);
        scales[i].value = withSpring(1.0, RETURN_SPRING);
      }
    }
  }, [tabCount]);

  return { lifts, scales, activateTab };
}
