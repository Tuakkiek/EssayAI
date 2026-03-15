/**
 * LiquidGlassBar.tsx - iOS 26 Liquid Glass, cross-platform
 *
 * Matches Apple Music iOS 26 tab bar:
 *  - Floating frosted-glass pill (transparent enough to see content blur)
 *  - Active tab: accent icon + label + white capsule background (fade in/out, no sliding)
 *  - Inactive: gray icons + labels
 *  - Icon micro-lift + scale pulse on press
 *  - Android: heavier tint to compensate blur
 *
 * Brand accent: #58CC02 (system green)
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
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// --- Brand ---------------------------------------------------------------------
const ACCENT = "#58CC02";
const ICON_ACTIVE = ACCENT;
const ICON_INACTIVE = "#8E8E93";

// --- Geometry ------------------------------------------------------------------
export const BAR_H = 70;
export const H_INSET = 16;
export const BOTTOM_FLOAT = Platform.OS === "ios" ? 28 : 18;
const CORNER = BAR_H / 2;
const CAPSULE_H = 52;
const CAPSULE_V = (BAR_H - CAPSULE_H) / 2;

// How much screens should pad their bottom content
export const TAB_BAR_BOTTOM_OFFSET = BAR_H + BOTTOM_FLOAT + 14;

// --- Animation configs ---------------------------------------------------------
const LIFT_SPRING = { damping: 20, stiffness: 400, mass: 0.55 } as const;
const SCALE_SPRING = { damping: 16, stiffness: 440, mass: 0.5 } as const;
const FADE_MS = 200;

// --- Single tab button ---------------------------------------------------------
interface TabBtnProps {
  route: any;
  focused: boolean;
  options: any;
  onPress: () => void;
  lift: Animated.SharedValue<number>;
  scale: Animated.SharedValue<number>;
}

const TabBtn = memo(function TabBtn({
  route,
  focused,
  options,
  onPress,
  lift,
  scale,
}: TabBtnProps) {
  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: lift.value }, { scale: scale.value }],
  }));

  const capsuleStyle = useAnimatedStyle(() => ({
    opacity: withTiming(focused ? 1 : 0, { duration: FADE_MS }),
  }));

  const iconColor = focused ? ICON_ACTIVE : ICON_INACTIVE;
  const icon = options.tabBarIcon?.({ focused, color: iconColor, size: 22 });
  const label =
    typeof options.tabBarLabel === "string"
      ? options.tabBarLabel
      : typeof options.title === "string"
        ? options.title
        : route.name;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={1}
      style={s.tabBtn}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
    >
      {/* White frosted capsule - fades in/out on active tab */}
      <Animated.View style={[s.activeCapsule, capsuleStyle]} pointerEvents="none" />

      {/* Icon + label */}
      <Animated.View style={[s.btnContent, contentStyle]}>
        <View style={s.iconWrap}>{icon}</View>
        <Text
          numberOfLines={1}
          style={[
            s.tabLabel,
            {
              color: iconColor,
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

// --- Main bar ------------------------------------------------------------------
export function LiquidGlassBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();

  // Pre-allocate 5 slots for icon animations
  /* eslint-disable react-hooks/rules-of-hooks */
  const l = [
    useSharedValue(0),
    useSharedValue(0),
    useSharedValue(0),
    useSharedValue(0),
    useSharedValue(0),
  ];
  const sc = [
    useSharedValue(1),
    useSharedValue(1),
    useSharedValue(1),
    useSharedValue(1),
    useSharedValue(1),
  ];
  /* eslint-enable react-hooks/rules-of-hooks */

  const prevIdx = useRef(-1);

  // Only routes with tabBarIcon declared (hidden routes are excluded)
  const visibleRoutes = state.routes.filter(
    (r: any) => descriptors[r.key].options.tabBarIcon !== undefined,
  );

  const activeVIdx = visibleRoutes.findIndex(
    (r: any) => r.key === state.routes[state.index]?.key,
  );

  const animIcons = useCallback((next: number, prev: number) => {
    if (next < l.length) {
      l[next].value = withSpring(-3, LIFT_SPRING);
      sc[next].value = withSequence(
        withSpring(1.12, SCALE_SPRING),
        withSpring(1.0, SCALE_SPRING),
      );
    }
    if (prev >= 0 && prev < l.length && prev !== next) {
      l[prev].value = withSpring(0, LIFT_SPRING);
      sc[prev].value = withSpring(1.0, SCALE_SPRING);
    }
  }, []);

  // Initialize icon states on first render
  React.useEffect(() => {
    const idx = activeVIdx >= 0 ? activeVIdx : 0;
    if (prevIdx.current === -1) {
      if (idx < l.length) l[idx].value = -3;
      prevIdx.current = idx;
    }
  }, []);

  // React to navigation changes
  React.useEffect(() => {
    const idx = activeVIdx >= 0 ? activeVIdx : 0;
    if (prevIdx.current !== idx) {
      animIcons(idx, prevIdx.current);
      prevIdx.current = idx;
    }
  }, [state.index]);

  const bottom = Math.max(insets.bottom, 6) + BOTTOM_FLOAT;

  return (
    <View style={[s.wrapper, { bottom }]} pointerEvents="box-none">
      {/* Glass pill container */}
      <View style={s.pill}>
        {/* Layer 1: Blur (frosted glass base) */}
        <BlurView
          intensity={Platform.OS === "ios" ? 90 : 55}
          tint={Platform.OS === "ios" ? "systemChromeMaterial" : "light"}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Layer 2: White tint wash */}
        <View
          style={[
            StyleSheet.absoluteFillObject,
            s.tintBase,
            Platform.OS === "android" && s.tintAndroid,
          ]}
          pointerEvents="none"
        />

        {/* Layer 3: Top meniscus highlight */}
        <View style={s.topEdge} pointerEvents="none" />

        {/* Tabs */}
        <View style={s.row}>
          {visibleRoutes.map((route: any, i: number) => {
            const { options } = descriptors[route.key];
            const focused = route.key === state.routes[state.index]?.key;

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
                lift={l[i] ?? l[0]}
                scale={sc[i] ?? sc[0]}
              />
            );
          })}
        </View>
      </View>

    </View>
  );
}

// --- Styles --------------------------------------------------------------------
const s = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: H_INSET,
    right: H_INSET,
    height: BAR_H,
  },

  pill: {
    flex: 1,
    height: BAR_H,
    borderRadius: CORNER,
    overflow: "hidden",
  },

  // iOS tint: very light (glass shows through)
  tintBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },
  // Android tint: heavier to compensate for weaker blur
  tintAndroid: {
    backgroundColor: "rgba(244, 244, 246, 0.82)",
  },

  topEdge: {
    position: "absolute",
    top: 0,
    left: CORNER * 0.5,
    right: CORNER * 0.5,
    height: 1,
    borderRadius: 0.5,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    zIndex: 10,
  },

  row: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    zIndex: 2,
  },

  tabBtn: {
    flex: 1,
    height: BAR_H,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  activeCapsule: {
    position: "absolute",
    top: CAPSULE_V,
    left: 4,
    right: 4,
    height: CAPSULE_H,
    borderRadius: CAPSULE_H / 2,
    backgroundColor:
      Platform.OS === "ios"
        ? "rgba(255, 255, 255, 0.80)"
        : "rgba(225, 224, 224, 0.96)",
    ...Platform.select({
      android: {
        borderWidth: 0.5,
        borderColor: "rgba(255, 255, 255, 0.95)",
      },
    }),
  },

  btnContent: {
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    zIndex: 1,
  },

  iconWrap: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },

  tabLabel: {
    fontSize: 10.5,
    letterSpacing: 0.1,
    textAlign: "center",
  },

});
