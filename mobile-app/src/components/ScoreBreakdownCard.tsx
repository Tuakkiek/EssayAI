import React from "react"
import { View, Text, StyleSheet } from "react-native"
import { ScoreBreakdown } from "../types"
import { getBandColor } from "@/utils/bandColor"
import { Colors, Radius, Shadow, Spacing, Typography } from "@/constants/theme"

interface Props {
  breakdown: ScoreBreakdown
}

const CRITERIA: { key: keyof ScoreBreakdown; label: string }[] = [
  { key: "taskAchievement", label: "Task Achievement" },
  { key: "coherenceCohesion", label: "Coherence & Cohesion" },
  { key: "lexicalResource", label: "Lexical Resource" },
  { key: "grammaticalRange", label: "Grammar Range" },
]

export const ScoreBreakdownCard: React.FC<Props> = ({ breakdown }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Score Breakdown</Text>
      {CRITERIA.map((c) => {
        const value = breakdown[c.key]
        const color = getBandColor(value)
        const pct = Math.max(0, Math.min(100, (value / 9) * 100))
        return (
          <View key={c.key} style={styles.row}>
            <View style={styles.rowTop}>
              <Text style={styles.label}>{c.label}</Text>
              <Text style={[styles.value, { color }]}>{value.toFixed(1)}</Text>
            </View>
            <View style={styles.barBg}>
              <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
            </View>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  title: {
    ...Typography.heading3,
    marginBottom: Spacing.md,
  },
  row: {
    marginBottom: Spacing.md,
  },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  label: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  value: {
    fontSize: 14,
    fontWeight: "700",
  },
  barBg: {
    height: 6,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.full,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: Radius.full,
  },
})

