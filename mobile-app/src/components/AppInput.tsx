/**
 * AppInput — Text input with error shake animation.
 * Spec: borderRadius 16, shake 150ms on error
 */
import React, { useRef, useEffect } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
  TextInputProps,
} from "react-native";
import { Colors, Radius, Shadow, Spacing, Timing, Typography } from "../constants/theme";

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  containerStyle?: ViewStyle;
  icon?: React.ReactNode;
}

export function AppInput({
  label,
  error,
  hint,
  containerStyle,
  icon,
  ...props
}: AppInputProps) {
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (error) {
      // Horizontal shake per spec
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 8,  duration: 40, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 6,  duration: 40, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -4, duration: 30, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0,  duration: Timing.shake * 0.3, useNativeDriver: true }),
      ]).start();
    }
  }, [error]);

  return (
    <Animated.View
      style={[
        styles.wrapper,
        containerStyle,
        { transform: [{ translateX: shakeAnim }] },
      ]}
    >
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputRow,
          error ? styles.inputError : styles.inputNormal,
        ]}
      >
        {icon && <View style={styles.iconWrap}>{icon}</View>}
        <TextInput
          style={[styles.input, icon ? styles.inputWithIcon : null]}
          placeholderTextColor={Colors.textMuted}
          {...props}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
      {!error && hint && <Text style={styles.hintText}>{hint}</Text>}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.xs },
  label: {
    ...Typography.bodyMedium,
    color: Colors.text,
    marginBottom: 2,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.md, // 16
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Shadow.xs,
  },
  inputNormal: { borderColor: Colors.border },
  inputError:  { borderColor: Colors.errorSoft, backgroundColor: Colors.errorLight },
  input: {
    flex: 1,
    ...Typography.body,
    color: Colors.text,
    paddingVertical: 4,
  },
  inputWithIcon: { marginLeft: Spacing.sm },
  iconWrap: { opacity: 0.6 },
  errorText: {
    ...Typography.caption,
    color: Colors.errorSoft,
    marginTop: 2,
  },
  hintText: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
