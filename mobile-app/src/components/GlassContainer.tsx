/**
 * components/GlassContainer.tsx
 *
 * 5-layer Apple glass surface simulation.
 *
 * Layer stack (back to front):
 *   Layer 1 — BlurView (frosted glass blur, intensity 70)
 *   Layer 2 — Translucent white tint overlay
 *   Layer 3 — Top-edge highlight border (glass meniscus)
 *   Layer 4 — Inner reflection gradient (SVG linear gradient, subtle)
 *   Layer 5 — Outer border highlight
 *
 * The container floats above the bottom edge with a layered shadow system.
 */

import React, { memo } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { BlurView } from "expo-blur";
import Svg, { Defs, LinearGradient, Stop, Rect } from "react-native-svg";
import { Colors } from "../theme/colors";
import { Spacing } from "../theme/spacing";

interface GlassContainerProps {
  children: React.ReactNode;
  width: number;
}

const CORNER = Spacing.barCornerRadius;
const HEIGHT = Spacing.barHeight;

// ── Inner reflection gradient overlay ─────────────────────────────────────
const ReflectionGradient = memo(function ReflectionGradient({
  width,
}: {
  width: number;
}) {
  return (
    <Svg
      width={width}
      height={HEIGHT}
      style={StyleSheet.absoluteFillObject}
      pointerEvents="none"
    >
      <Defs>
        {/* Top-to-center vertical gradient: subtle white → transparent */}
        <LinearGradient id="glassReflection" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%"   stopColor="#FFFFFF" stopOpacity={0.22} />
          <Stop offset="42%"  stopColor="#FFFFFF" stopOpacity={0.08} />
          <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0.00} />
        </LinearGradient>

        {/* Side edge gleam gradient: subtle left→right shine */}
        <LinearGradient id="glassSideGleam" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%"   stopColor="#FFFFFF" stopOpacity={0.12} />
          <Stop offset="20%"  stopColor="#FFFFFF" stopOpacity={0.00} />
          <Stop offset="80%"  stopColor="#FFFFFF" stopOpacity={0.00} />
          <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0.10} />
        </LinearGradient>
      </Defs>

      {/* Vertical reflection */}
      <Rect
        x={0} y={0}
        width={width} height={HEIGHT}
        rx={CORNER} ry={CORNER}
        fill="url(#glassReflection)"
      />

      {/* Side gleam */}
      <Rect
        x={0} y={0}
        width={width} height={HEIGHT}
        rx={CORNER} ry={CORNER}
        fill="url(#glassSideGleam)"
      />
    </Svg>
  );
});

export const GlassContainer = memo(function GlassContainer({
  children,
  width,
}: GlassContainerProps) {
  return (
    <View style={[styles.outerShadow, { width }]}>
      {/* Deep drop shadow */}
      <View style={[styles.shadowLayer1, { width, borderRadius: CORNER }]} />
      {/* Soft ambient shadow */}
      <View style={[styles.shadowLayer2, { width, borderRadius: CORNER }]} />

      {/* ── Main glass body ─────────────────────────────────────── */}
      <View style={[styles.glassBody, { width }]}>
        {/* Layer 1: Blur */}
        <BlurView
          intensity={70}
          tint="light"
          style={[StyleSheet.absoluteFillObject, styles.blurLayer]}
        />

        {/* Layer 2: White tint overlay */}
        <View style={[StyleSheet.absoluteFillObject, styles.tintOverlay]} />

        {/* Layer 4: SVG inner reflection gradient */}
        <ReflectionGradient width={width} />

        {/* Layer 3: Top-edge meniscus highlight (hairline white line) */}
        <View style={styles.topEdgeHighlight} />

        {/* Layer 3b: Bottom inner shadow for depth */}
        <View style={styles.bottomDepth} />

        {/* Content */}
        {children}
      </View>

      {/* Layer 5: Outer border highlight */}
      <View
        style={[
          styles.outerBorder,
          { width, borderRadius: CORNER },
        ]}
        pointerEvents="none"
      />
    </View>
  );
});

const styles = StyleSheet.create({
  outerShadow: {
    position: "relative",
    // Primary deep shadow
    shadowColor: Colors.shadowDeep,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 28,
    elevation: 18,
  },

  // Layered shadow trick for a more diffuse look on iOS
  shadowLayer1: {
    position: "absolute",
    height: HEIGHT,
    backgroundColor: "transparent",
    shadowColor: Colors.shadowDeep,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
  },
  shadowLayer2: {
    position: "absolute",
    height: HEIGHT,
    backgroundColor: "transparent",
    shadowColor: Colors.shadowSoft,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },

  glassBody: {
    height: HEIGHT,
    borderRadius: CORNER,
    overflow: "hidden",
    // On Android, elevation handles shadow; overflow:hidden clips blur
    ...Platform.select({
      android: {
        elevation: 12,
      },
    }),
  },

  blurLayer: {
    borderRadius: CORNER,
  },

  tintOverlay: {
    borderRadius: CORNER,
    backgroundColor: Colors.glassBackground,
  },

  // Top meniscus — the bright 1px highlight line at top of glass
  topEdgeHighlight: {
    position: "absolute",
    top: 0,
    left: CORNER * 0.5,
    right: CORNER * 0.5,
    height: 1,
    backgroundColor: Colors.glassHighlight,
    opacity: 0.9,
    borderRadius: 0.5,
  },

  // Subtle inner shadow at bottom for ground-glass depth
  bottomDepth: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 12,
    borderBottomLeftRadius: CORNER,
    borderBottomRightRadius: CORNER,
    backgroundColor: "rgba(0, 0, 0, 0.035)",
  },

  // Outer border highlight (Layer 5)
  outerBorder: {
    position: "absolute",
    top: 0,
    left: 0,
    height: HEIGHT,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    backgroundColor: "transparent",
    pointerEvents: "none",
  },
});
