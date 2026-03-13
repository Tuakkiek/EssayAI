import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { GrammarError } from "../types";
import { Colors, Radius, Shadow, Spacing, Typography } from "@/constants/theme";

interface Props {
  errors: GrammarError[];
}

export const GrammarErrorCard: React.FC<Props> = ({ errors }) => {
  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.accentBar} />
          <Text style={styles.title}>Grammar Errors</Text>
        </View>
        {errors.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{errors.length}</Text>
          </View>
        )}
      </View>

      {errors.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyIcon}>✓</Text>
          <Text style={styles.emptyText}>No grammar errors found.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {errors.map((e, i) => (
            <View key={`${e.original}-${i}`} style={styles.item}>
              {/* Index number */}
              <View style={styles.indexWrap}>
                <Text style={styles.indexText}>{i + 1}</Text>
              </View>

              <View style={styles.itemContent}>
                {/* Original */}
                <View style={styles.originalWrap}>
                  <Text style={styles.label}>Original</Text>
                  <Text style={styles.original}>{e.original}</Text>
                </View>

                {/* Arrow + Correction */}
                <View style={styles.correctionWrap}>
                  <Text style={styles.arrow}>→</Text>
                  <View style={styles.correctionBox}>
                    <Text style={styles.correctionLabel}>Suggested Correction</Text>
                    <Text style={styles.correction}>{e.corrected}</Text>
                  </View>
                </View>

                {/* Explanation */}
                {e.explanation ? (
                  <Text style={styles.explanation}>{e.explanation}</Text>
                ) : null}

                {/* Tip */}
                {e.tip ? (
                  <View style={styles.tipWrap}>
                    <Text style={styles.tipLabel}>Tip </Text>
                    <Text style={styles.tipText}>{e.tip}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
    overflow: "hidden",
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  accentBar: {
    width: 4,
    height: 20,
    borderRadius: 2,
    backgroundColor: Colors.error,
  },
  title: {
    ...Typography.heading3,
  },
  countBadge: {
    backgroundColor: "#FEE2E2",
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 3,
    minWidth: 28,
    alignItems: "center",
  },
  countText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.error,
  },

  // ── Empty ────────────────────────────────────────────────────────────────────
  emptyWrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 16,
    color: Colors.success,
    fontWeight: "700",
  },
  emptyText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },

  // ── List ─────────────────────────────────────────────────────────────────────
  list: {
    gap: 0,
  },
  item: {
    flexDirection: "row",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
    alignItems: "flex-start",
  },

  // Index number column
  indexWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
    flexShrink: 0,
  },
  indexText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.error,
  },

  // Content column
  itemContent: {
    flex: 1,
    gap: 8,
  },

  // Original
  originalWrap: {
    gap: 2,
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.textMuted,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  original: {
    ...Typography.bodySmall,
    color: Colors.error,
    lineHeight: 20,
  },

  // Correction
  correctionWrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  arrow: {
    fontSize: 14,
    color: Colors.success,
    fontWeight: "700",
    marginTop: 14,
  },
  correctionBox: {
    flex: 1,
    backgroundColor: "#F0FDF4",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderLeftWidth: 2,
    borderLeftColor: Colors.success,
    gap: 2,
  },
  correctionLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.success,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  correction: {
    ...Typography.bodySmall,
    color: "#16A34A",
    fontWeight: "600",
    lineHeight: 20,
  },

  // Explanation
  explanation: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  // Tip
  tipWrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFBEB",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tipLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.warning,
    flexShrink: 0,
  },
  tipText: {
    ...Typography.caption,
    color: "#92400E",
    flex: 1,
    lineHeight: 18,
  },
});
