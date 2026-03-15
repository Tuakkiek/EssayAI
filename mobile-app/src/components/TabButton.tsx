/**
 * components/TabButton.tsx
 *
 * Single tab button with magnetic icon interaction.
 *
 * Behavior:
 *  - Icon lifts upward when active (translateY: -6, spring)
 *  - Icon pulses on press (scale: 1 → 1.12 → 1.0)
 *  - Color transitions: inactive gray → active black
 *  - Label fades in when active
 *  - Minimum tap target: 44×44 (accessibility)
 */

import React, { memo, useCallback, useRef } from "react";
import {
  TouchableOpacity,
  StyleSheet,
  LayoutChangeEvent,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { LucideIcon } from "lucide-react-native";
import { Colors } from "../theme/colors";
import { Spacing } from "../theme/spacing";

// ── Types ──────────────────────────────────────────────────────────────────
export interface TabButtonProps {
  icon:       LucideIcon;
  label:      string;
  index:      number;
  isActive:   boolean;
  lift:       Animated.SharedValue<number>;
  scale:      Animated.SharedValue<number>;
  onPress:    (index: number, centerX: number) => void;
  onLayout?:  (index: number, x: number, width: number) => void;
}

export const TabButton = memo(function TabButton({
  icon: Icon,
  label,
  index,
  isActive,
  lift,
  scale,
  onPress,
  onLayout,
}: TabButtonProps) {
  const layoutRef = useRef<{ x: number; width: number }>({ x: 0, width: 0 });

  // ── Icon animated style (lift + scale on UI thread) ───────────────────
  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: lift.value },
      { scale: scale.value },
    ],
  }));

  // ── Label animation ───────────────────────────────────────────────────
  const labelStyle = useAnimatedStyle(() => ({
    opacity:   withTiming(isActive ? 1 : 0.45, { duration: 200 }),
    transform: [
      { scale: withTiming(isActive ? 1 : 0.85, { duration: 180 }) },
    ],
  }));

  const activeColor   = Colors.iconActive;
  const inactiveColor = Colors.iconInactive;
  const iconColorStr  = isActive ? activeColor : inactiveColor;

  // ── Layout measurement ────────────────────────────────────────────────
  const handleLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const { x, width } = e.nativeEvent.layout;
      layoutRef.current = { x, width };
      onLayout?.(index, x, width);
    },
    [index, onLayout],
  );

  const handlePress = useCallback(() => {
    const centerX = layoutRef.current.x + layoutRef.current.width / 2;
    onPress(index, centerX);
  }, [index, onPress]);

  return (
    <TouchableOpacity
      onLayout={handleLayout}
      onPress={handlePress}
      activeOpacity={1}
      style={styles.button}
      accessibilityLabel={label}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
    >
      <Animated.View style={[styles.iconWrap, iconStyle]}>
        <Icon
          size={Spacing.iconSize}
          color={iconColorStr}
          strokeWidth={isActive ? 2.5 : Spacing.iconStroke}
        />
      </Animated.View>

      <Animated.Text
        style={[
          styles.label,
          { color: iconColorStr },
          labelStyle,
        ]}
        numberOfLines={1}
      >
        {label}
      </Animated.Text>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  button: {
    flex: 1,
    minWidth: Spacing.tabMinWidth,
    height: Spacing.barHeight,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    // Ensure z-index above blob (blob is pointerEvents:none anyway)
    zIndex: 2,
  },
  iconWrap: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.15,
    textAlign: "center",
  },
});
