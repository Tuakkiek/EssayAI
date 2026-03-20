/**
 * LiquidGlassBar.tsx — Apple Liquid Glass Tab Bar
 *
 * Triết lý Liquid Glass của Apple — 6 lớp:
 *
 *  PILL (outer bar)
 *  ├── L0  Shadow system    — deep drop + ambient + subtle colored glow
 *  ├── L1  Primary blur     — systemChromeMaterial, intensity 90  (frosted base)
 *  ├── L2  Milk glass tint  — rgba white 0.18  (warm brightness)
 *  ├── L3  Specular sheen   — SVG diagonal gradient top-left → center
 *  ├── L4  Meniscus top     — 1 px bright hairline on top edge
 *  ├── L5  Bottom depth     — dark gradient at bottom inner edge
 *  └── L6  Outer rim        — hairline border rgba white 0.45
 *
 *  CAPSULE (active indicator)
 *  ├── L1  Primary blur     — systemMaterialLight, intensity 80   (gray see-through)
 *  ├── L2  Milk glass tint  — rgba white 0.22
 *  ├── L3  Inner glow       — SVG radial gradient center→edge
 *  ├── L4  Meniscus top     — bright 1 px hairline
 *  ├── L5  Specular pill    — small bright ellipse top-left
 *  └── L6  Outer border     — rgba white 0.58 hairline + shadow
 *
 *  ANIMATIONS
 *  ├── Capsule  — fade + scaleX spring (no sliding)
 *  ├── Icon     — translateY spring lift (-5 px) on active
 *  └── Scale    — pulse 1.0 → 1.12 → 1.0 on press
 */

import React, { memo, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, {
  Defs,
  RadialGradient,
  LinearGradient,
  Stop,
  Rect,
  Ellipse,
} from "react-native-svg";

// ─── Geometry ──────────────────────────────────────────────────────────────────
export const BAR_H        = 68;
const H_INSET             = 18;
export const BOTTOM_FLOAT = Platform.OS === "ios" ? 28 : 16;
const CORNER              = BAR_H / 2;          // full pill radius

const CAPSULE_H           = 52;
const CAPSULE_V           = (BAR_H - CAPSULE_H) / 2;

export const TAB_BAR_BOTTOM_OFFSET = BAR_H + BOTTOM_FLOAT + 12;

// ─── Brand & icon colors ───────────────────────────────────────────────────────
const ACCENT        = "#58CC02";
const ICON_ACTIVE   = ACCENT;
const ICON_INACTIVE = "#8E8E93";

// ─── Glass color tokens ────────────────────────────────────────────────────────
// Pill
const PILL_MILK          = "rgba(255,255,255,0.18)";   // warm milk glass layer
const PILL_MILK_ANDROID  = "rgba(244,244,248,0.82)";   // heavier fallback
const PILL_MENISCUS      = "rgba(255,255,255,0.78)";   // top-edge bright line
const PILL_BOTTOM_DEPTH  = "rgba(0,0,0,0.06)";         // bottom inner shadow
const PILL_BORDER        = "rgba(255,255,255,0.45)";   // outer rim

// Capsule — keep near-transparent so blur shows content beneath
// systemMaterialLight (iOS) already provides the gray frosted look
const CAP_MILK           = "rgba(255,255,255,0.00)";  // iOS: zero — blur only
const CAP_MILK_ANDROID   = "rgba(230,230,235,0.45)";  // Android fallback
const CAP_MENISCUS       = "rgba(255,255,255,0.80)";
const CAP_BORDER         = "rgba(255,255,255,0.55)";
const CAP_SPECULAR       = "rgba(255,255,255,0.55)";

// ─── Animation configs ─────────────────────────────────────────────────────────
const LIFT_CFG  = { damping: 18, stiffness: 400, mass: 0.48 } as const;
const SCALE_CFG = { damping: 13, stiffness: 440, mass: 0.42 } as const;
const FADE_DUR  = 200;
const SCALE_DUR = 200;

// ─── SVG Specular Sheen — pill diagonal glint ──────────────────────────────────
const PillSpecular = memo(function PillSpecular({
  w,
  h,
}: {
  w: number;
  h: number;
}) {
  return (
    <Svg
      width={w}
      height={h}
      style={StyleSheet.absoluteFillObject}
      pointerEvents="none"
    >
      <Defs>
        {/* Diagonal light sweep top-left → bottom-center */}
        <LinearGradient id="pillSheen" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%"   stopColor="#FFFFFF" stopOpacity={0.22} />
          <Stop offset="38%"  stopColor="#FFFFFF" stopOpacity={0.07} />
          <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0.00} />
        </LinearGradient>
      </Defs>
      <Rect
        x={0} y={0}
        width={w} height={h}
        rx={CORNER} ry={CORNER}
        fill="url(#pillSheen)"
      />
    </Svg>
  );
});

// ─── SVG Inner Glow + Specular — capsule ──────────────────────────────────────
const CapsuleGlow = memo(function CapsuleGlow({
  w,
  h,
}: {
  w: number;
  h: number;
}) {
  const r = h / 2;
  return (
    <Svg
      width={w}
      height={h}
      style={StyleSheet.absoluteFillObject}
      pointerEvents="none"
    >
      <Defs>
        {/* Radial inner glow from center */}
        {/* Radial inner glow — near-zero, just enough for glass edge */}
        <RadialGradient
          id="capsuleGlow"
          cx="50%" cy="50%" r="50%"
          fx="50%" fy="50%"
        >
          <Stop offset="0%"   stopColor="#FFFFFF" stopOpacity={0.00} />
          <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0.00} />
        </RadialGradient>

        {/* Top-half sheen — only the very top edge catches light */}
        <LinearGradient id="capsuleSheen" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%"   stopColor="#FFFFFF" stopOpacity={0.06} />
          <Stop offset="30%"  stopColor="#FFFFFF" stopOpacity={0.00} />
          <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0.00} />
        </LinearGradient>
      </Defs>

      {/* Full inner glow */}
      <Rect
        x={0} y={0}
        width={w} height={h}
        rx={r} ry={r}
        fill="url(#capsuleGlow)"
      />

      {/* Top-half vertical sheen */}
      <Rect
        x={0} y={0}
        width={w} height={h * 0.55}
        rx={r} ry={r}
        fill="url(#capsuleSheen)"
      />

      {/* Specular removed — too opaque */}
    </Svg>
  );
});

// ─── GlassCapsule — active tab indicator ──────────────────────────────────────
interface GlassCapsuleProps {
  capsuleStyle: ReturnType<typeof useAnimatedStyle>;
  capsuleW: number;
}

const GlassCapsule = memo(function GlassCapsule({
  capsuleStyle,
  capsuleW,
}: GlassCapsuleProps) {
  const w = capsuleW;
  const h = CAPSULE_H;

  return (
    <Animated.View
      style={[s.capsuleOuter, capsuleStyle]}
      pointerEvents="none"
    >
      {/* Outer hairline border (sits outside overflow:hidden) */}
      <View style={s.capsuleRim} />

      {/* Inner glass body */}
      <View style={s.capsuleInner}>
        {/* L1: Blur — lower intensity = less white haze, more see-through */}
        <BlurView
          intensity={Platform.OS === "ios" ? 55 : 35}
          tint={Platform.OS === "ios" ? "systemMaterialLight" : "light"}
          style={StyleSheet.absoluteFillObject}
        />

        {/* L2: Milk glass white tint */}
        <View
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundColor:
                Platform.OS === "ios" ? CAP_MILK : CAP_MILK_ANDROID,
            },
          ]}
        />

        {/* L3 + L4: SVG inner glow + specular */}
        {w > 0 && <CapsuleGlow w={w} h={h} />}

        {/* L4: Top meniscus — bright 1 px line */}
        <View style={s.capsuleMeniscus} />
      </View>
    </Animated.View>
  );
});

// ─── TabBtn ────────────────────────────────────────────────────────────────────
interface TabBtnProps {
  route:        any;
  focused:      boolean;
  options:      any;
  onPress:      () => void;
  lift:         Animated.SharedValue<number>;
  scale:        Animated.SharedValue<number>;
}

const TabBtn = memo(function TabBtn({
  route,
  focused,
  options,
  onPress,
  lift,
  scale,
}: TabBtnProps) {
  const [capsuleW, setCapsuleW] = React.useState(0);

  // Icon + label rise and scale
  const contentStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: lift.value },
      { scale: scale.value },
    ],
  }));

  // Capsule: fade in + gentle scaleX spring
  const capsuleAnim = useAnimatedStyle(() => ({
    opacity:   withTiming(focused ? 1 : 0, { duration: FADE_DUR }),
    transform: [
      {
        scaleX: withTiming(focused ? 1 : 0.82, {
          duration: SCALE_DUR,
        }),
      },
    ],
  }));

  // Dynamic icon opacity — fully opaque when active, dimmed when not
  const iconOpacity = useAnimatedStyle(() => ({
    opacity: withTiming(focused ? 1 : 0.58, { duration: FADE_DUR }),
  }));

  const iconColor = focused ? ICON_ACTIVE : ICON_INACTIVE;
  const icon      = options.tabBarIcon?.({ focused, color: iconColor, size: 22 });
  const label =
    typeof options.tabBarLabel === "string"
      ? options.tabBarLabel
      : typeof options.title === "string"
        ? options.title
        : route.name;

  const onLayout = useCallback(
    (e: any) => {
      const nextWidth = e.nativeEvent.layout.width;
      setCapsuleW((prev) => (prev === nextWidth ? prev : nextWidth));
    },
    [],
  );

  return (
    <TouchableOpacity
      onPress={onPress}
      onLayout={onLayout}
      activeOpacity={1}
      style={s.tabBtn}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
    >
      {/* ── Active glass capsule ──────────────────────────────────────────── */}
      <GlassCapsule
        capsuleStyle={capsuleAnim}
        capsuleW={capsuleW}
      />

      {/* ── Icon + label ──────────────────────────────────────────────────── */}
      <Animated.View style={[s.btnContent, contentStyle]}>
        <Animated.View style={[s.iconWrap, iconOpacity]}>
          {icon}
        </Animated.View>
        <Text
          numberOfLines={1}
          style={[
            s.tabLabel,
            {
              color:      iconColor,
              fontWeight: focused ? "700" : "500",
            },
          ]}
        >
          {label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
});

// ─── LiquidGlassBar ────────────────────────────────────────────────────────────
export function LiquidGlassBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();

  // Measure pill width for SVG sheen
  const [pillW, setPillW] = React.useState(0);

  // Pre-allocate 5 animation slots (hooks count must be static)
  /* eslint-disable react-hooks/rules-of-hooks */
  const lifts        = [useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0)];
  const scales       = [useSharedValue(1), useSharedValue(1), useSharedValue(1), useSharedValue(1), useSharedValue(1)];
  /* eslint-enable react-hooks/rules-of-hooks */

  const prevIdx = useRef(-1);

  const visibleRoutes = state.routes.filter(
    (r: any) => descriptors[r.key].options.tabBarIcon !== undefined,
  );

  const activeVIdx = visibleRoutes.findIndex(
    (r: any) => r.key === state.routes[state.index]?.key,
  );

  const animateTab = useCallback((next: number, prev: number) => {
    if (next < lifts.length) {
      lifts[next].value  = withSpring(-5, LIFT_CFG);
      scales[next].value = withSequence(
        withSpring(1.12, SCALE_CFG),
        withSpring(1.00, SCALE_CFG),
      );
    }
    if (prev >= 0 && prev < lifts.length && prev !== next) {
      lifts[prev].value  = withSpring(0, LIFT_CFG);
      scales[prev].value = withSpring(1.0, SCALE_CFG);
    }
  }, []);

  React.useEffect(() => {
    const idx = activeVIdx >= 0 ? activeVIdx : 0;
    if (prevIdx.current === -1) {
      if (idx < lifts.length) lifts[idx].value = -5;
      prevIdx.current = idx;
    }
  }, []);

  React.useEffect(() => {
    const idx = activeVIdx >= 0 ? activeVIdx : 0;
    if (prevIdx.current !== idx) {
      animateTab(idx, prevIdx.current);
      prevIdx.current = idx;
    }
  }, [state.index]);

  const bottom = Math.max(insets.bottom, 4) + BOTTOM_FLOAT;

  return (
    <View
      style={[s.wrapper, { bottom }]}
      pointerEvents="box-none"
    >
      {/* ── Shadow system ──────────────────────────────────────────────────── */}
      {/* L0a: Deep drop shadow */}
      <View style={[   { borderRadius: CORNER }]} />
      {/* L0b: Soft ambient shadow */}
      <View style={[ { borderRadius: CORNER }]} />
      {/* L0c: Subtle green glow (brand color) */}
      <View style={[    { borderRadius: CORNER }]} />

      {/* ── Glass pill ─────────────────────────────────────────────────────── */}
      <View
        style={s.pill}
        onLayout={(e) => setPillW(e.nativeEvent.layout.width)}
      >
        {/* L1: Primary blur — frosted glass base */}
        <BlurView
          intensity={Platform.OS === "ios" ? 90 : 55}
          tint={Platform.OS === "ios" ? "systemChromeMaterial" : "light"}
          style={StyleSheet.absoluteFillObject}
        />

        {/* L2: Milk glass warm white tint */}
        <View
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundColor:
                Platform.OS === "ios" ? PILL_MILK : PILL_MILK_ANDROID,
            },
          ]}
          pointerEvents="none"
        />

        {/* L3: SVG specular diagonal sheen */}
        {pillW > 0 && (
          <PillSpecular w={pillW} h={BAR_H} />
        )}

        {/* L4: Top meniscus — bright 1 px hairline */}
        <View style={s.pillMeniscus} pointerEvents="none" />

        {/* L5: Bottom inner depth shadow */}
        <View style={s.pillBottomDepth} pointerEvents="none" />

        {/* Tabs */}
        <View style={s.row}>
          {visibleRoutes.map((route: any, i: number) => {
            const { options } = descriptors[route.key];
            const focused     = route.key === state.routes[state.index]?.key;

            const onPress = () => {
              const ev = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !ev.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <TabBtn
                key={route.key}
                route={route}
                focused={focused}
                options={options}
                onPress={onPress}
                lift={lifts[i]        ?? lifts[0]}
                scale={scales[i]      ?? scales[0]}
              />
            );
          })}
        </View>
      </View>

      {/* L6: Outer rim — hairline border */}
      <View
        style={[s.pillOuterRim, { borderRadius: CORNER }]}
        pointerEvents="none"
      />
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left:     H_INSET,
    right:    H_INSET,
    height:   BAR_H,
  },

  // ── Shadow system ────────────────────────────────────────────────────────────
  shadowDeep: {

  },
  shadowAmbient: {

  },
  // Subtle brand-colored glow underneath
  shadowGlow: {

  },

  // ── Glass pill ───────────────────────────────────────────────────────────────
  pill: {
    flex:         1,
    height:       BAR_H,
    borderRadius: CORNER,
    overflow:     "hidden",   // clips all inner layers
    ...Platform.select({ android: { elevation: 18 } }),
  },

  // 1 px meniscus at very top of pill
  pillMeniscus: {
    position:        "absolute",
    top:             0,
    left:            CORNER * 0.55,
    right:           CORNER * 0.55,
    height:          1,
    backgroundColor: PILL_MENISCUS,
    borderRadius:    1,
  },

  // Inner shadow at bottom edge — makes pill feel deep
  pillBottomDepth: {

  },

  // Outer hairline rim (outside overflow:hidden, so it shows)
  pillOuterRim: {
    ...StyleSheet.absoluteFillObject,
    borderWidth:     1,
    borderColor:     PILL_BORDER,
    backgroundColor: "transparent",
  },

  // ── Tab row ──────────────────────────────────────────────────────────────────
  row: {
    flex:              1,
    flexDirection:     "row",
    alignItems:        "center",
    paddingHorizontal: 4,
    zIndex:            2,
  },

  tabBtn: {
    flex:            1,
    height:          BAR_H,
    alignItems:      "center",
    justifyContent:  "center",
    position:        "relative",
  },

  // ── Glass capsule (active indicator) ─────────────────────────────────────────

  // Outer wrapper — position + animation target
  // overflow:visible so the outer rim shows outside the clipped inner
  capsuleOuter: {
    position:     "absolute",
    top:          CAPSULE_V,
    left:         4,
    right:        4,
    height:       CAPSULE_H,
    borderRadius: CAPSULE_H / 2,
    // Outer border ring visible outside clipped inner
    borderWidth:  0.8,
    borderColor:  CAP_BORDER,
    // Capsule shadow for depth (lifts above pill)
    shadowColor:  "#a0a0a0",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius:  6,
    elevation:    3,
  },

  // Inner body — clips blur + tint + glow to border radius
  capsuleInner: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: CAPSULE_H / 2,
    overflow:     "hidden",
  },

  // Hairline rim inside the clipped area
  capsuleRim: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: CAPSULE_H / 2,
    borderWidth:  0.5,
    borderColor:  "rgba(255,255,255,0.40)",
    zIndex:       10,
  },

  // 1 px bright meniscus on top of capsule
  capsuleMeniscus: {
    position:        "absolute",
    top:             0,
    left:            CAPSULE_H * 0.4,
    right:           CAPSULE_H * 0.4,
    height:          1,
    backgroundColor: CAP_MENISCUS,
    borderRadius:    1,
    opacity:         0.9,
  },

  // ── Icon + label ─────────────────────────────────────────────────────────────
  btnContent: {
    alignItems:     "center",
    justifyContent: "center",
    gap:            3,
    zIndex:         3,
  },

  iconWrap: {
    width:          26,
    height:         26,
    alignItems:     "center",
    justifyContent: "center",
  },

  tabLabel: {
    fontSize:      10.5,
    letterSpacing: 0.1,
    textAlign:     "center",
  },
});
