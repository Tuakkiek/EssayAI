/**
 * useLiquidTabAnimation.ts
 *
 * Core animation engine for the Liquid Glass tab bar.
 *
 * Responsibilities:
 *  - Track the shared position of the liquid indicator
 *  - Emit per-tab scale/lift values
 *  - Produce blob "stretch" during slide (scaleX elongates in travel direction)
 *  - All values are Reanimated shared values → GPU-accelerated
 */

import { useCallback, useRef } from "react";
import {
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  interpolate,
  Extrapolation,
  SharedValue,
} from "react-native-reanimated";

// ── Spring configs ─────────────────────────────────────────────────────────
const SLIDE_SPRING = {
  damping:   22,
  stiffness: 280,
  mass:      0.8,
  overshootClamping: false,
};

const SETTLE_SPRING = {
  damping:   26,
  stiffness: 320,
  mass:      0.7,
};

const PRESS_SPRING = {
  damping:   18,
  stiffness: 400,
  mass:      0.6,
};

// ── Types ──────────────────────────────────────────────────────────────────
export interface TabAnimationState {
  /** 0-based index of active tab */
  activeIndex: SharedValue<number>;

  /** Raw translation X of the indicator center */
  indicatorX: SharedValue<number>;

  /** Blob horizontal stretch: 1 = circle, >1 = pill-stretch left/right */
  blobScaleX: SharedValue<number>;

  /** Blob vertical slight compress during travel */
  blobScaleY: SharedValue<number>;

  /** Per-tab: icon vertical lift (negative = up) */
  iconLifts: SharedValue<number>[];

  /** Per-tab: icon press scale */
  iconScales: SharedValue<number>[];

  /** Indicator opacity fade-in on mount */
  indicatorOpacity: SharedValue<number>;

  /** Call this when user presses a tab */
  onTabPress: (index: number, tabCenterX: number) => void;
}

export interface UseLiquidTabAnimationOptions {
  tabCount: number;
  initialIndex?: number;
}

export function useLiquidTabAnimation({
  tabCount,
  initialIndex = 0,
}: UseLiquidTabAnimationOptions): TabAnimationState {
  const activeIndex    = useSharedValue<number>(initialIndex);
  const indicatorX     = useSharedValue<number>(0);
  const blobScaleX     = useSharedValue<number>(1);
  const blobScaleY     = useSharedValue<number>(1);
  const indicatorOpacity = useSharedValue<number>(0);

  // Allocate per-tab shared values (hooks count must be fixed → pre-allocate max=5)
  const MAX_TABS = 5;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const iconLifts  = Array.from({ length: MAX_TABS }, () => useSharedValue<number>(0));
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const iconScales = Array.from({ length: MAX_TABS }, () => useSharedValue<number>(1));

  // Track previous tab center to calculate direction
  const prevX = useRef<number>(0);

  const onTabPress = useCallback((index: number, tabCenterX: number) => {
    "worklet";
    // ── 1. Determine travel direction and distance ───────────────────────
    const dx        = tabCenterX - prevX.current;
    const isMoving  = Math.abs(dx) > 4;

    // ── 2. Icon scale micro-interaction on pressed tab ───────────────────
    iconScales[index].value = withSequence(
      withSpring(1.12, PRESS_SPRING),
      withSpring(1.0,  SETTLE_SPRING),
    );

    // ── 3. Icon lift on active tab ───────────────────────────────────────
    // Lift active, drop previous
    for (let i = 0; i < tabCount; i++) {
      iconLifts[i].value = withSpring(
        i === index ? -4 : 0,
        SETTLE_SPRING,
      );
    }

    // ── 4. Blob stretch during movement ──────────────────────────────────
    if (isMoving) {
      // Stretch in direction of travel proportional to distance
      const stretch = interpolate(
        Math.abs(dx),
        [40, 120, 280],
        [1.0, 1.25, 1.55],
        Extrapolation.CLAMP,
      );
      // Quick stretch out, then spring back to circle
      blobScaleX.value = withSequence(
        withTiming(stretch, { duration: 120 }),
        withSpring(1.0, SETTLE_SPRING),
      );
      blobScaleY.value = withSequence(
        withTiming(interpolate(stretch, [1, 1.55], [1, 0.78]), { duration: 120 }),
        withSpring(1.0, SETTLE_SPRING),
      );
    }

    // ── 5. Slide indicator ────────────────────────────────────────────────
    indicatorX.value = withSpring(tabCenterX, SLIDE_SPRING);

    // ── 6. Update state ───────────────────────────────────────────────────
    activeIndex.value    = index;
    prevX.current        = tabCenterX;
    indicatorOpacity.value = withTiming(1, { duration: 200 });
  }, [tabCount]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    activeIndex,
    indicatorX,
    blobScaleX,
    blobScaleY,
    iconLifts:  iconLifts.slice(0, tabCount),
    iconScales: iconScales.slice(0, tabCount),
    indicatorOpacity,
    onTabPress,
  };
}
