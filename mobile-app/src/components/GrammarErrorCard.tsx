import React from "react"
import { View, Text, StyleSheet } from "react-native"
import { GrammarError } from "../types"
import { Colors, Radius, Shadow, Spacing, Typography } from "@/constants/theme"

interface Props {
  errors: GrammarError[]
}

export const GrammarErrorCard: React.FC<Props> = ({ errors }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Grammar Errors</Text>
      {errors.length === 0 ? (
        <Text style={styles.empty}>No grammar issues detected.</Text>
      ) : (
        errors.map((e, i) => (
          <View key={`${e.original}-${i}`} style={[styles.item, i < errors.length - 1 && styles.divider]}>
            <Text style={styles.original}>Original: {e.original}</Text>
            <Text style={styles.correction}>Correction: {e.correction}</Text>
            <Text style={styles.explanation}>{e.explanation}</Text>
            {e.tip ? <Text style={styles.tip}>Tip: {e.tip}</Text> : null}
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
  original: {
    ...Typography.bodySmall,
    color: Colors.error,
    marginBottom: 2,
  },
  correction: {
    ...Typography.bodySmall,
    color: Colors.success,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  explanation: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  tip: {
    ...Typography.caption,
    color: Colors.warning,
    marginTop: Spacing.xs,
  },
})

