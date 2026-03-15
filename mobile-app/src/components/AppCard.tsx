/**
 * AppCard — Container component.
 * Spec: borderRadius 22, white surface, soft shadow
 */
import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { Colors, Radius, Shadow, Spacing } from "../constants/theme";

interface AppCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  variant?: "default" | "success" | "error" | "flat";
}

export function AppCard({
  children,
  style,
  padding = Spacing.lg,
  variant = "default",
}: AppCardProps) {
  const variantStyle =
    variant === "success"
      ? { borderWidth: 1.5, borderColor: Colors.primary }
      : variant === "error"
        ? { borderWidth: 1.5, borderColor: Colors.errorSoft }
        : variant === "flat"
          ? { backgroundColor: Colors.background }
          : {};

  return (
    <View
      style={[
        styles.card,
        variant !== "flat" && Shadow.sm,
        variantStyle,
        { padding },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl, // 22
    overflow: "hidden",
  },
});
