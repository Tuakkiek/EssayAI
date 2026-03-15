/**
 * FeedbackCard — Small improvement card.
 * Spec: problem summary → suggestion → optional detail. No long paragraphs.
 * Supportive copywriting ("Nice effort! Try using...")
 */
import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { ChevronDown, CheckCircle, AlertCircle, Lightbulb, BookOpen } from "lucide-react-native";
import { Colors, Radius, Shadow, Spacing, Typography } from "../constants/theme";

type FeedbackCategory = "grammar" | "vocabulary" | "clarity" | "structure";

interface FeedbackCardProps {
  category: FeedbackCategory;
  problem: string;
  suggestion: string;
  detail?: string;
  original?: string;
  corrected?: string;
}

const CATEGORY_CONFIG = {
  grammar: {
    icon: AlertCircle,
    color: Colors.errorSoft,
    bg: Colors.errorLight,
    label: "Grammar",
    prefix: "Nice try! Here's a cleaner way:",
  },
  vocabulary: {
    icon: BookOpen,
    color: Colors.info,
    bg: Colors.infoLight,
    label: "Vocabulary",
    prefix: "Elevate your word choice:",
  },
  clarity: {
    icon: Lightbulb,
    color: Colors.warning,
    bg: Colors.warningLight,
    label: "Clarity",
    prefix: "This will make your idea shine:",
  },
  structure: {
    icon: CheckCircle,
    color: Colors.primary,
    bg: Colors.primaryLight,
    label: "Structure",
    prefix: "Strong structure tip:",
  },
};

export function FeedbackCard({
  category,
  problem,
  suggestion,
  detail,
  original,
  corrected,
}: FeedbackCardProps) {
  const [expanded, setExpanded] = useState(false);
  const cfg = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.grammar;
  const Icon = cfg.icon;

  return (
    <View style={[styles.card, Shadow.xs]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: cfg.bg }]}>
          <Icon size={16} color={cfg.color} strokeWidth={2.2} />
        </View>
        <Text style={[styles.categoryLabel, { color: cfg.color }]}>{cfg.label}</Text>
      </View>

      {/* Supportive prefix + problem */}
      <Text style={styles.prefix}>{cfg.prefix}</Text>
      <Text style={styles.problem} numberOfLines={expanded ? undefined : 2}>
        {problem}
      </Text>

      {/* Before → After */}
      {original && corrected && (
        <View style={styles.diffRow}>
          <View style={[styles.diffPill, styles.diffBefore]}>
            <Text style={styles.diffBeforeText} numberOfLines={1}>{original}</Text>
          </View>
          <Text style={styles.diffArrow}>→</Text>
          <View style={[styles.diffPill, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.diffAfterText, { color: cfg.color }]} numberOfLines={1}>
              {corrected}
            </Text>
          </View>
        </View>
      )}

      {/* Suggestion */}
      <Text style={styles.suggestion}>{suggestion}</Text>

      {/* Expandable detail */}
      {detail && (
        <TouchableOpacity
          style={styles.expandRow}
          onPress={() => setExpanded((v) => !v)}
          activeOpacity={0.7}
        >
          <Text style={[styles.expandLabel, { color: cfg.color }]}>
            {expanded ? "Show less" : "Learn more"}
          </Text>
          <ChevronDown
            size={14}
            color={cfg.color}
            strokeWidth={2.5}
            style={{ transform: [{ rotate: expanded ? "180deg" : "0deg" }] }}
          />
        </TouchableOpacity>
      )}

      {expanded && detail && (
        <Text style={styles.detail}>{detail}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl, // 22
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: 2,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: Radius.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryLabel: {
    ...Typography.label,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  prefix: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontStyle: "italic",
  },
  problem: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  diffRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginVertical: Spacing.xs,
    flexWrap: "wrap",
  },
  diffPill: {
    borderRadius: Radius.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    maxWidth: "42%",
  },
  diffBefore: { backgroundColor: Colors.errorLight },
  diffBeforeText: {
    ...Typography.caption,
    color: Colors.errorSoft,
    fontWeight: "600",
    textDecorationLine: "line-through",
  },
  diffArrow: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    fontWeight: "700",
  },
  diffAfterText: {
    ...Typography.caption,
    fontWeight: "700",
  },
  suggestion: {
    ...Typography.bodySmall,
    color: Colors.text,
    lineHeight: 20,
    fontWeight: "500",
  },
  expandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  expandLabel: {
    ...Typography.caption,
    fontWeight: "700",
  },
  detail: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
    backgroundColor: Colors.background,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
  },
});
