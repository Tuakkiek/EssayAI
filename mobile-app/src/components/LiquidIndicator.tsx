/**
 * components/LiquidIndicator.tsx
 *
 * The liquid blob that glides between tabs using SVG path morphing.
 *
 * The blob shape is described as a cubic bezier approximation of an ellipse.
 * Four anchor points (top, right, bottom, left) with two control handles each.
 *
 * Bezier circle constant: k = 0.5523
 *   This gives the most accurate circle approximation with 4 cubic beziers.
 *
 * The path is recomputed every animation frame via useDerivedValue worklet.
 * blobX  → center X (spring-animated by useLiquidPhysics)
 * blobRx → horizontal radius (stretches during travel)
 * blobRy → vertical radius (compresses during travel)
 *
 * Layers inside the blob:
 *   • Base fill  — rgba(255,255,255,0.75)
 *   • Inner glow — smaller translucent ellipse
 *   • Specular   — small rotated white pill (top-left light reflection)
 *   • Border     — near-white stroke
 */

import React, { memo } from "react";
import Svg, {
  Path,
  Defs,
  RadialGradient,
  Stop,
  Ellipse,
} from "react-native-svg";
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
} from "react-native-reanimated";
import { StyleSheet } from "react-native";
import { Colors } from "../theme/colors";
import { Spacing } from "../theme/spacing";

// ── Animated SVG components ────────────────────────────────────────────────
const AnimatedPath    = Animated.createAnimatedComponent(Path);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

// ── Bezier circle constant ────────────────────────────────────────────────
// k = 4/3 × tan(π/8) ≈ 0.5523
const K = 0.5523;

/**
 * Compute an SVG path string for a bezier-approximated ellipse.
 *
 * @param cx  center X
 * @param cy  center Y
 * @param rx  horizontal radius
 * @param ry  vertical radius
 *
 * Must be annotated 'worklet' so Reanimated can run on UI thread.
 */
function buildEllipsePath(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
): string {
  "worklet";
  const kx = K * rx;
  const ky = K * ry;

  // 4-segment cubic bezier ellipse (counter-clockwise from top)
  return (
    `M ${cx} ${cy - ry} ` +
    `C ${cx + kx} ${cy - ry} ${cx + rx} ${cy - ky} ${cx + rx} ${cy} ` +
    `C ${cx + rx} ${cy + ky} ${cx + kx} ${cy + ry} ${cx} ${cy + ry} ` +
    `C ${cx - kx} ${cy + ry} ${cx - rx} ${cy + ky} ${cx - rx} ${cy} ` +
    `C ${cx - rx} ${cy - ky} ${cx - kx} ${cy - ry} ${cx} ${cy - ry} ` +
    `Z`
  );
}

// ── Types ──────────────────────────────────────────────────────────────────
interface LiquidIndicatorProps {
  blobX:     Animated.SharedValue<number>;
  blobRx:    Animated.SharedValue<number>;
  blobRy:    Animated.SharedValue<number>;
  blobAlpha: Animated.SharedValue<number>;
  barWidth:  number;
  barHeight: number;
}

const CY = Spacing.barHeight / 2; // vertical center of blob

// ── Component ──────────────────────────────────────────────────────────────
export const LiquidIndicator = memo(function LiquidIndicator({
  blobX,
  blobRx,
  blobRy,
  blobAlpha,
  barWidth,
  barHeight,
}: LiquidIndicatorProps) {

  // ── Main blob path (computed every frame in worklet) ──────────────────
  const blobPathProps = useAnimatedProps(() => ({
    d: buildEllipsePath(blobX.value, CY, blobRx.value, blobRy.value),
  }));

  // ── Inner glow ellipse (smaller, centered on same point) ──────────────
  const innerGlowProps = useAnimatedProps(() => ({
    cx: blobX.value,
    cy: CY,
    rx: blobRx.value * 0.70,
    ry: blobRy.value * 0.65,
  }));

  // ── Specular highlight (small ellipse, offset top-left inside blob) ──
  const specularProps = useAnimatedProps(() => ({
    cx: blobX.value - blobRx.value * 0.28,
    cy: CY - blobRy.value * 0.32,
    rx: blobRx.value * 0.28,
    ry: blobRy.value * 0.18,
  }));

  // ── Container opacity ─────────────────────────────────────────────────
  const containerStyle = useAnimatedStyle(() => ({
    opacity: blobAlpha.value,
  }));

  return (
    <Animated.View
      style={[StyleSheet.absoluteFillObject, containerStyle]}
      pointerEvents="none"
    >
      <Svg
        width={barWidth}
        height={barHeight}
        style={StyleSheet.absoluteFillObject}
      >
        <Defs>
          {/* Radial gradient for inner glow */}
          <RadialGradient
            id="liquidBlobGlow"
            cx="50%"
            cy="50%"
            r="50%"
            fx="50%"
            fy="50%"
          >
            <Stop
              offset="0%"
              stopColor="#FFFFFF"
              stopOpacity={0.55}
            />
            <Stop
              offset="100%"
              stopColor="#FFFFFF"
              stopOpacity={0.00}
            />
          </RadialGradient>
        </Defs>

        {/* Layer 2: Main blob fill */}
        <AnimatedPath
          animatedProps={blobPathProps}
          fill={Colors.blobFill}
          stroke={Colors.blobBorder}
          strokeWidth={1.0}
        />

        {/* Layer 3: Inner glow ellipse */}
        <AnimatedEllipse
          animatedProps={innerGlowProps}
          fill="url(#liquidBlobGlow)"
        />

        {/* Layer 4: Specular highlight — small bright pill at top-left */}
        <AnimatedEllipse
          animatedProps={specularProps}
          fill={Colors.blobSpecular}
          opacity={0.72}
        />
      </Svg>
    </Animated.View>
  );
});
