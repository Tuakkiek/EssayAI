/**
 * ProgressIndicator — Animated processing state.
 * Spec: encouraging text, animated dots, no technical language.
 */
import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { Colors, Radius, Shadow, Spacing, Typography } from "../constants/theme";

const MESSAGES = [
  "Analyzing your ideas...",
  "Checking grammar patterns...",
  "Looking for improvements...",
  "Reviewing your argument...",
  "Measuring vocabulary range...",
  "Almost there! Polishing results...",
];

interface ProgressIndicatorProps {
  visible?: boolean;
  elapsed?: number;
}

export function ProgressIndicator({ visible = true, elapsed = 0 }: ProgressIndicatorProps) {
  const [msgIndex, setMsgIndex] = useState(0);
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();

    // Rotate messages
    const msgTimer = setInterval(() => {
      setMsgIndex((i) => (i + 1) % MESSAGES.length);
    }, 2500);

    // Animated dots
    const animateDots = () => {
      const anim = (dot: Animated.Value, delay: number) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(dot, { toValue: 1,   duration: 300, useNativeDriver: true }),
            Animated.timing(dot, { toValue: 0.3, duration: 400, useNativeDriver: true }),
          ])
        );
      Animated.parallel([anim(dot1, 0), anim(dot2, 200), anim(dot3, 400)]).start();
    };
    animateDots();

    return () => {
      clearInterval(msgTimer);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={[styles.card, Shadow.md]}>
        {/* Animated dots */}
        <View style={styles.dotsRow}>
          {[dot1, dot2, dot3].map((dot, i) => (
            <Animated.View
              key={i}
              style={[styles.dot, { opacity: dot }]}
            />
          ))}
        </View>

        <Text style={styles.message}>{MESSAGES[msgIndex]}</Text>

        {elapsed > 8 && (
          <Text style={styles.elapsed}>{elapsed}s</Text>
        )}

        <Text style={styles.sub}>
          AI is carefully reading every sentence ✨
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xxl, // 24
    padding: Spacing.xl,
    alignItems: "center",
    gap: Spacing.md,
    width: "100%",
  },
  dotsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  message: {
    ...Typography.title3,
    color: Colors.text,
    textAlign: "center",
    fontWeight: "600",
  },
  elapsed: {
    ...Typography.caption,
    color: Colors.textMuted,
    backgroundColor: Colors.background,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
  },
  sub: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
});
