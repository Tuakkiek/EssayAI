import React from "react"
import { View, Text, StyleSheet } from "react-native"
import { Suggestion } from "../types"
import { Colors, Radius, Shadow, Spacing, Typography } from "@/constants/theme"

interface Props {
  suggestions: Suggestion[]
}

export const SuggestionsCard: React.FC<Props> = ({ suggestions }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Suggestions</Text>
      {suggestions.length === 0 ? (
        <Text style={styles.empty}>No suggestions available.</Text>
      ) : (
        suggestions.map((s, i) => (
          <View key={`${s.category}-${i}`} style={[styles.item, i < suggestions.length - 1 && styles.divider]}>
            <Text style={styles.category}>{s.category.toUpperCase()}</Text>
            <Text style={styles.point}>{s.point}</Text>
            {s.example ? <Text style={styles.example}>Example: {s.example}</Text> : null}
          </View>
        ))
      )}
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
  empty: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  item: {
    paddingVertical: Spacing.sm,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  category: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: "700",
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  point: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  example: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
})

