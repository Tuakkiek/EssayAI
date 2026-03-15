/**
 * ScoreCard — Hero score display with count-up animation.
 * Spec: count-up 700–1200ms, never display instantly, encouragement first.
 */
import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { Colors, Radius, Shadow, Spacing, Timing, Typography } from "../constants/theme";

interface ScoreCardProps {
  score: number;
  label?: string;
  message?: string;
  animate?: boolean;
}

const BAND_CONFIG: Record<string, { color: string; bg: string; emoji: string; label: string }> = {
  excellent: { color: Colors.info,      bg: Colors.infoLight,    emoji: "🌟", label: "Excellent!" },
  high:      { color: Colors.primary,   bg: Colors.primaryLight, emoji: "🎉", label: "Great job!" },
  mid:       { color: Colors.warning,   bg: Colors.warningLight, emoji: "💪", label: "Keep going!" },
  low:       { color: Colors.errorSoft, bg: Colors.errorLight,   emoji: "✨", label: "Nice effort!" },
};

function getBand(score: number) {
  if (score >= 7.5) return BAND_CONFIG.excellent;
  if (score >= 6.0) return BAND_CONFIG.high;
  if (score >= 5.0) return BAND_CONFIG.mid;
  return BAND_CONFIG.low;
}

export function ScoreCard({ score, label, message, animate = true }: ScoreCardProps) {
  const [displayScore, setDisplayScore] = useState(animate ? 0 : score);
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const band = getBand(score);

  useEffect(() => {
    if (!animate) return;

    // Count-up animation per spec: 700–1200ms
    const duration = Timing.scoreCountUp;
    const steps = 60;
    const stepTime = duration / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += 1;
      const progress = current / steps;
      // Ease-out cubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(parseFloat((easedProgress * score).toFixed(1)));

      if (current >= steps) {
        clearInterval(timer);
        setDisplayScore(score);
        // Bounce finish
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          speed: 12,
          bounciness: 10,
        }).start();
      }
    }, stepTime);

    // Fade in container
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();

    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 8,
      bounciness: 0,
    }).start();

    return () => clearInterval(timer);
  }, [score, animate]);

  return (
    <Animated.View
      style={[
        styles.card,
        { backgroundColor: band.bg, opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
        Shadow.md,
      ]}
    >
      {/* Encouragement first — per spec */}
      <Text style={styles.emoji}>{band.emoji}</Text>
      <Text style={[styles.bandLabel, { color: band.color }]}>{band.label}</Text>

      {/* Score */}
      <Text style={[styles.scoreNum, { color: band.color }]}>
        {displayScore.toFixed(1)}
      </Text>
      <Text style={styles.scoreSubLabel}>IELTS Band Score</Text>

      {/* Message */}
      {message && (
        <View style={[styles.messagePill, { backgroundColor: band.color + "18" }]}>
          <Text style={[styles.messageText, { color: band.color }]}>{message}</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xxl, // 24
    padding: Spacing.xl,
    alignItems: "center",
    gap: Spacing.xs,
  },
  emoji: {
    fontSize: 48,
    marginBottom: Spacing.xs,
  },
  bandLabel: {
    ...Typography.title3,
    fontWeight: "700",
  },
  scoreNum: {
    ...Typography.scoreLarge,
    marginTop: Spacing.xs,
    marginBottom: 0,
  },
  scoreSubLabel: {
    ...Typography.label,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  messagePill: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    marginTop: Spacing.xs,
  },
  messageText: {
    ...Typography.caption,
    fontWeight: "600",
  },
});
