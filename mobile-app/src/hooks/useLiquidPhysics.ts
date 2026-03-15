/**
 * hooks/useLiquidPhysics.ts
 *
 * Physics engine for the liquid blob indicator.
 * All values are Reanimated shared values — everything runs on UI thread.
 *
 * Blob deformation model:
 *
 *   blobX    — center X position, spring-driven
 *   blobRx   — horizontal radius: stretches during travel, compresses on arrival
 *   blobRy   — vertical radius: inverse of Rx (volume conservation)
 *   blobAlpha — opacity fade on mount
 *
 * Deformation sequence on tab press:
 *   1. blobX springs toward target (stiffness 220, damping 18, mass 0.7)
 *   2. blobRx quickly stretches to stretchRx (withTiming 90ms)
 *   3. blobRy compresses proportionally
 *   4. As blobX nears target, blobRx spring-bounces back to resting radius
 *   5. Slight overshoot compression (blobRx → 0.88× radius) then settle
 *
 * The SVG path is computed from blobX, blobRx, blobRy in LiquidIndicator.
 */

import { useCallback } from "react";
import {
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import { Spacing } from "../theme/spacing";

// ── Spring presets per spec ────────────────────────────────────────────────
export const BLOB_SPRING = {
  stiffness: 220,
  damping:   18,
  mass:      0.7,
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01,
} as const;

const STRETCH_SPRING = {
  stiffness: 340,
  damping:   20,
  mass:      0.55,
} as const;

const SETTLE_SPRING = {
  stiffness: 280,
  damping:   22,
  mass:      0.6,
} as const;

// ── Deformation parameters ─────────────────────────────────────────────────
const REST_RX    = Spacing.blobRadius;
const REST_RY    = Spacing.blobRadius;
const MAX_STRETCH_RATIO = 1.42;    // max horizontal stretch at full-width jump
const MIN_COMPRESS_RY   = 0.78;    // how much Y compresses at peak stretch
const ARRIVE_COMPRESS   = 0.86;    // brief compression on arrival (Y-over, X-under)

// ── Types ──────────────────────────────────────────────────────────────────
export interface LiquidPhysicsState {
  blobX:     ReturnType<typeof useSharedValue<number>>;
  blobRx:    ReturnType<typeof useSharedValue<number>>;
  blobRy:    ReturnType<typeof useSharedValue<number>>;
  blobAlpha: ReturnType<typeof useSharedValue<number>>;
  isReady:   ReturnType<typeof useSharedValue<boolean>>;
  moveBlobTo: (targetX: number, travelDistance: number) => void;
  initBlob:   (initialX: number) => void;
}

export function useLiquidPhysics(): LiquidPhysicsState {
  const blobX     = useSharedValue(0);
  const blobRx    = useSharedValue(REST_RX);
  const blobRy    = useSharedValue(REST_RY);
  const blobAlpha = useSharedValue(0);
  const isReady   = useSharedValue(false);

  const initBlob = useCallback((initialX: number) => {
    "worklet";
    blobX.value     = initialX;
    blobAlpha.value = withTiming(1, { duration: 280 });
    isReady.value   = true;
  }, []);

  const moveBlobTo = useCallback(
    (targetX: number, travelDistance: number) => {
      "worklet";

      // ── 1. Compute stretch magnitude based on travel distance ────────────
      const normalizedDist = Math.min(Math.abs(travelDistance) / (Spacing.barWidth * 0.75), 1);
      const stretchRx = REST_RX * (1 + (MAX_STRETCH_RATIO - 1) * normalizedDist);
      const compressRy = REST_RY * (MIN_COMPRESS_RY + (1 - MIN_COMPRESS_RY) * (1 - normalizedDist));

      // ── 2. Leading-edge stretch: fast timing, then spring-bounce back ────
      blobRx.value = withSequence(
        withTiming(stretchRx, { duration: 90 }),
        withDelay(
          60,
          withSpring(REST_RX, STRETCH_SPRING),
        ),
      );

      // Y-axis: compress during stretch, then slight bounce overshoot, settle
      blobRy.value = withSequence(
        withTiming(compressRy, { duration: 90 }),
        withDelay(
          60,
          withSequence(
            withSpring(REST_RY * ARRIVE_COMPRESS, {
              stiffness: 380,
              damping: 14,
              mass: 0.5,
            }),
            withSpring(REST_RY, SETTLE_SPRING),
          ),
        ),
      );

      // ── 3. Position: physics spring per spec ─────────────────────────────
      blobX.value = withSpring(targetX, BLOB_SPRING);
    },
    [],
  );

  return {
    blobX,
    blobRx,
    blobRy,
    blobAlpha,
    isReady,
    moveBlobTo,
    initBlob,
  };
}
