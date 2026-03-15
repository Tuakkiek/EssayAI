/**
 * AppButton — Primary interactive element.
 * Spec: scale 1 → 0.95 → 1 on press (120ms), height 48, borderRadius 18
 */
import React, { useRef } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  ActivityIndicator,
  Animated,
  ViewStyle,
  TextStyle,
} from "react-native";
import { Colors, Radius, Shadow, Spacing, Timing, Typography } from "../constants/theme";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  fullWidth?: boolean;
}

const SIZE_CONFIG = {
  sm: { height: 40, paddingH: Spacing.md,  fontSize: 14 },
  md: { height: 48, paddingH: Spacing.lg,  fontSize: 16 },
  lg: { height: 56, paddingH: Spacing.xl,  fontSize: 17 },
};

const VARIANT_CONFIG = {
  primary:   { bg: Colors.primary,    text: "#FFFFFF",              shadow: Shadow.green  },
  secondary: { bg: Colors.surface,    text: Colors.text,            shadow: Shadow.sm     },
  ghost:     { bg: "transparent",     text: Colors.primary,         shadow: Shadow.none   },
  danger:    { bg: Colors.errorSoft,  text: "#FFFFFF",              shadow: Shadow.sm     },
};

export function AppButton({
  label,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon,
  iconRight,
  style,
  labelStyle,
  fullWidth = true,
}: AppButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const vc = VARIANT_CONFIG[variant];
  const sc = SIZE_CONFIG[size];

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: Timing.buttonPress,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  };

  const isDisabled = disabled || loading;

  return (
    <Animated.View
      style={[
        { transform: [{ scale: scaleAnim }] },
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        activeOpacity={1}
        style={[
          styles.base,
          vc.shadow,
          {
            height: sc.height,
            paddingHorizontal: sc.paddingH,
            backgroundColor: vc.bg,
            borderRadius: Radius.lg,
            opacity: isDisabled ? 0.55 : 1,
          },
          variant === "secondary" && styles.secondaryBorder,
          variant === "ghost" && styles.ghostStyle,
        ]}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === "primary" || variant === "danger" ? "#FFFFFF" : Colors.primary}
          />
        ) : (
          <View style={styles.content}>
            {icon && <View style={styles.iconLeft}>{icon}</View>}
            <Text
              style={[
                styles.label,
                { color: vc.text, fontSize: sc.fontSize },
                labelStyle,
              ]}
            >
              {label}
            </Text>
            {iconRight && <View style={styles.iconRight}>{iconRight}</View>}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fullWidth: { width: "100%" },
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  label: {
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  iconLeft: { marginRight: 2 },
  iconRight: { marginLeft: 2 },
  secondaryBorder: {
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  ghostStyle: {
    borderWidth: 0,
  },
});
