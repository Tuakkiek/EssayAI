/**
 * LiquidGlassTabBar.tsx
 *
 * Apple-style Liquid Glass floating tab bar dùng cho Expo Router.
 *
 * Tính năng:
 *   - SVG bezier blob morphing chạy trên UI thread (Reanimated worklet)
 *   - Spring physics: stiffness 220 / damping 18 / mass 0.7
 *   - Biến dạng bề mặt (blob stretch khi di chuyển, compress khi đến nơi)
 *   - Glass effect 4 lớp: BlurView + tint overlay + top highlight + bottom depth
 *   - Icon lift (-6px) + scale pulse (1.12×) khi activate
 *
 * Cách dùng trong _layout.tsx:
 *   import { LiquidGlassTabBar } from "@/src/components/LiquidGlassTabBar";
 *   <Tabs tabBar={(props) => <LiquidGlassTabBar {...props} />} ...>
 *
 * Yêu cầu:
 *   npx expo install react-native-reanimated expo-blur react-native-svg
 */

import React, { useCallback, useEffect, useRef, useState, memo } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  LayoutChangeEvent,
  Platform,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import Svg, { Path, Ellipse, Defs, RadialGradient, Stop } from "react-native-svg";

// ─── Bezier ellipse constant ───────────────────────────────────────────────────
const K = 0.5523;

// ─── Spring presets ────────────────────────────────────────────────────────────
const BLOB_SPRING = { stiffness: 220, damping: 18, mass: 0.7 } as const;
const FAST_SPRING = { stiffness: 340, damping: 20, mass: 0.55 } as const;
const LIFT_SPRING = { stiffness: 300, damping: 18, mass: 0.65 } as const;
const SCALE_SPRING = { stiffness: 380, damping: 16, mass: 0.55 } as const;

// ─── Blob resting shape ────────────────────────────────────────────────────────
const REST_RX = 26;
const REST_RY = 20;
const BAR_CY = 37; // vertical center of blob inside 74px bar

// ─── Geometry ─────────────────────────────────────────────────────────────────
const { width: SCREEN_W } = Dimensions.get("window");
const BAR_H = 74;
const BAR_BOTTOM = Platform.OS === "ios" ? 28 : 18;
const H_INSET = 16;
const BAR_W = SCREEN_W - H_INSET * 2;

// ─── Build SVG bezier ellipse path (worklet) ───────────────────────────────────
function buildBlobPath(cx: number, cy: number, rx: number, ry: number): string {
  "worklet";
  const kx = K * rx;
  const ky = K * ry;
  return (
    `M${cx} ${cy - ry}` +
    `C${cx + kx} ${cy - ry} ${cx + rx} ${cy - ky} ${cx + rx} ${cy}` +
    `C${cx + rx} ${cy + ky} ${cx + kx} ${cy + ry} ${cx} ${cy + ry}` +
    `C${cx - kx} ${cy + ry} ${cx - rx} ${cy + ky} ${cx - rx} ${cy}` +
    `C${cx - rx} ${cy - ky} ${cx - kx} ${cy - ry} ${cx} ${cy - ry}Z`
  );
}

// ─── Animated SVG primitives ───────────────────────────────────────────────────
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

// ─── Blob Indicator ────────────────────────────────────────────────────────────
interface BlobProps {
  bx: Animated.SharedValue<number>;
  brx: Animated.SharedValue<number>;
  bry: Animated.SharedValue<number>;
  alpha: Animated.SharedValue<number>;
}

const BlobIndicator = memo(function BlobIndicator({ bx, brx, bry, alpha }: BlobProps) {
  const pathProps = useAnimatedProps(() => ({
    d: buildBlobPath(bx.value, BAR_CY, brx.value, bry.value),
  }));
  const glowProps = useAnimatedProps(() => ({
    cx: bx.value,
    cy: BAR_CY,
    rx: brx.value * 0.72,
    ry: bry.value * 0.65,
  }));
  const specProps = useAnimatedProps(() => ({
    cx: bx.value - brx.value * 0.28,
    cy: BAR_CY - bry.value * 0.34,
    rx: brx.value * 0.26,
    ry: bry.value * 0.17,
  }));
  const containerStyle = useAnimatedStyle(() => ({
    opacity: alpha.value,
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, containerStyle]} pointerEvents="none">
      <Svg
        width={BAR_W}
        height={BAR_H}
        style={StyleSheet.absoluteFillObject}
        viewBox={`0 0 ${BAR_W} ${BAR_H}`}
      >
        <Defs>
          <RadialGradient id="blobGlow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.55} />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        {/* Base blob */}
        <AnimatedPath
          animatedProps={pathProps}
          fill="rgba(255,255,255,0.76)"
          stroke="rgba(255,255,255,0.92)"
          strokeWidth={1}
        />
        {/* Inner glow */}
        <AnimatedEllipse animatedProps={glowProps} fill="url(#blobGlow)" />
        {/* Specular highlight */}
        <AnimatedEllipse animatedProps={specProps} fill="rgba(255,255,255,0.68)" />
      </Svg>
    </Animated.View>
  );
});

// ─── Single Tab Button ─────────────────────────────────────────────────────────
interface TabButtonProps {
  route: any;
  focused: boolean;
  options: any;
  onPress: () => void;
  onLayout: (centerX: number) => void;
  lift: Animated.SharedValue<number>;
  scale: Animated.SharedValue<number>;
}

const TabButton = memo(function TabButton({
  route,
  focused,
  options,
  onPress,
  onLayout,
  lift,
  scale,
}: TabButtonProps) {
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: lift.value }, { scale: scale.value }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: withTiming(focused ? 1 : 0.6, { duration: 220 }),
  }));

  const icon = options.tabBarIcon?.({
    focused,
    color: focused ? "#1D1D1F" : "#6E6E73",
    size: 22,
  });

  const label =
    typeof options.tabBarLabel === "string"
      ? options.tabBarLabel
      : options.title ?? route.name;

  const handleLayout = (e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    onLayout(x + width / 2);
  };

  return (
    <TouchableOpacity
      onLayout={handleLayout}
      onPress={onPress}
      activeOpacity={1}
      style={styles.tabBtn}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
    >
      <Animated.View style={[styles.iconWrap, iconStyle]}>{icon}</Animated.View>
      <Animated.Text
        style={[
          styles.tabLabel,
          { color: focused ? "#1D1D1F" : "#6E6E73" },
          labelStyle,
        ]}
        numberOfLines={1}
      >
        {label}
      </Animated.Text>
    </TouchableOpacity>
  );
});

// ─── Main Tab Bar ──────────────────────────────────────────────────────────────
export function LiquidGlassTabBar({ state, descriptors, navigation }: any) {
  // Blob shared values
  const bx = useSharedValue(0);
  const brx = useSharedValue(REST_RX);
  const bry = useSharedValue(REST_RY);
  const alpha = useSharedValue(0);

  // Per-tab lift & scale (up to 6 tabs)
  const lifts = useRef(Array.from({ length: 6 }, () => useSharedValue(0))).current;
  const scales = useRef(Array.from({ length: 6 }, () => useSharedValue(1))).current;

  const tabCenters = useRef<number[]>([]);
  const initialized = useRef(false);

  // Only visible tabs (with tabBarIcon)
  const visibleRoutes = state.routes.filter(
    (r: any) => !!descriptors[r.key].options.tabBarIcon,
  );

  const moveBlobTo = useCallback(
    (targetX: number, fromX: number) => {
      "worklet";
      const dist = Math.abs(targetX - fromX);
      const ratio = Math.min(dist / 200, 1);

      // Stretch towards target
      brx.value = withSequence(
        withTiming(REST_RX + 13 * ratio, { duration: 90 }),
        withDelay(60, withSpring(REST_RX, FAST_SPRING)),
      );
      bry.value = withSequence(
        withTiming(REST_RY - 6 * ratio, { duration: 90 }),
        withDelay(60, withSpring(REST_RY, FAST_SPRING)),
      );
      bx.value = withSpring(targetX, BLOB_SPRING);
    },
    [],
  );

  const activateTab = useCallback(
    (index: number) => {
      "worklet";
      for (let i = 0; i < 6; i++) {
        lifts[i].value = withSpring(i === index ? -6 : 0, LIFT_SPRING);
        if (i === index) {
          scales[i].value = withSequence(
            withSpring(1.12, SCALE_SPRING),
            withSpring(1.0, SCALE_SPRING),
          );
        } else {
          scales[i].value = withSpring(1.0, SCALE_SPRING);
        }
      }
    },
    [],
  );

  // Initialize on first layout
  const handleTabLayout = useCallback(
    (routeIndex: number, centerX: number) => {
      tabCenters.current[routeIndex] = centerX;
      if (initialized.current) return;
      // Wait until all tabs have reported
      if (tabCenters.current.filter(Boolean).length === visibleRoutes.length) {
        const activeCenter = tabCenters.current[state.index] ?? 0;
        bx.value = activeCenter;
        alpha.value = withTiming(1, { duration: 280 });
        activateTab(state.index);
        initialized.current = true;
      }
    },
    [state.index, visibleRoutes.length],
  );

  // React to external navigation changes
  useEffect(() => {
    if (!initialized.current) return;
    const cx = tabCenters.current[state.index];
    if (cx == null) return;
    const prev = bx.value;
    moveBlobTo(cx, prev);
    activateTab(state.index);
  }, [state.index]);

  const handleTabPress = useCallback(
    (routeIndex: number) => {
      const route = visibleRoutes[routeIndex];
      if (!route) return;
      const cx = tabCenters.current[routeIndex];
      if (cx != null) {
        moveBlobTo(cx, bx.value);
        activateTab(routeIndex);
      }
      const isFocused = state.index === state.routes.indexOf(route);
      const event = navigation.emit({
        type: "tabPress",
        target: route.key,
        canPreventDefault: true,
      });
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    },
    [visibleRoutes, state],
  );

  return (
    <View style={styles.barContainer} pointerEvents="box-none">
      {/* Glass shell */}
      <BlurView intensity={20} tint="light" style={styles.blur}>
        {/* White tint overlay */}
        <View style={styles.tintOverlay} />
        {/* Top meniscus highlight */}
        <View style={styles.topEdge} />
        {/* Bottom depth */}
        <View style={styles.bottomDepth} />

        {/* Liquid blob (behind icons) */}
        <BlobIndicator bx={bx} brx={brx} bry={bry} alpha={alpha} />

        {/* Tab buttons */}
        <View style={styles.tabRow}>
          {visibleRoutes.map((route: any, i: number) => {
            const { options } = descriptors[route.key];
            const focused = state.routes[state.index].key === route.key;
            return (
              <TabButton
                key={route.key}
                route={route}
                focused={focused}
                options={options}
                onPress={() => handleTabPress(i)}
                onLayout={(cx) => handleTabLayout(i, cx)}
                lift={lifts[i]}
                scale={scales[i]}
              />
            );
          })}
        </View>
      </BlurView>

      {/* Outer border highlight */}
      <View style={styles.outerBorder} pointerEvents="none" />
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  barContainer: {
    position: "absolute",
    bottom: BAR_BOTTOM,
    left: H_INSET,
    right: H_INSET,
    height: BAR_H,
    borderRadius: BAR_H / 2,
  },
  blur: {
    flex: 1,
    borderRadius: BAR_H / 2,
    overflow: "hidden",
  },
  tintOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.20)",
    borderRadius: BAR_H / 2,
  },
  topEdge: {
    position: "absolute",
    top: 0,
    left: BAR_H / 2,
    right: BAR_H / 2,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.82)",
    zIndex: 3,
  },
  bottomDepth: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 12,
    borderBottomLeftRadius: BAR_H / 2,
    borderBottomRightRadius: BAR_H / 2,
    backgroundColor: "rgba(0,0,0,0.035)",
  },
  tabRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 2,
  },
  tabBtn: {
    flex: 1,
    height: BAR_H,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    zIndex: 2,
  },
  iconWrap: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.1,
    textAlign: "center",
  },
  outerBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BAR_H / 2,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.48)",
    backgroundColor: "transparent",
  },
});
