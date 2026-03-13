import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Suggestion } from "../types";
import { Colors, Radius, Shadow, Spacing, Typography } from "@/constants/theme";

interface Props {
  suggestions: Suggestion[];
}

export const SuggestionsCard: React.FC<Props> = ({ suggestions }) => {
  const getFirstString = (...values: unknown[]) => {
    for (const value of values) {
      if (typeof value === "string" && value.trim()) return value.trim();
    }
    return "";
  };

  const normalized = suggestions
    .map((suggestion) => {
      const categoryRaw =
        typeof suggestion.category === "string"
          ? suggestion.category
          : typeof suggestion.type === "string"
            ? suggestion.type
            : "general";
      const text = getFirstString(
        suggestion.text,
        suggestion.improved,
        suggestion.explanation,
        suggestion.original,
      );
      const example = getFirstString(suggestion.example);
      return {
        category: categoryRaw,
        text,
        example: example || undefined,
      };
    })
    .filter((item) => item.text);

  const formatCategory = (category: string) =>
    category.replace(/_/g, " ").toUpperCase();

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Suggestions</Text>
      {normalized.length === 0 ? (
        <Text style={styles.empty}>No suggestions available.</Text>
      ) : (
        normalized.map((s, i) => (
          <View
            key={`${s.category}-${i}`}
            style={[styles.item, i < normalized.length - 1 && styles.divider]}
          >
            <Text style={styles.category}>{formatCategory(s.category)}</Text>
            <Text style={styles.point}>{s.text}</Text>
            {s.example ? (
              <Text style={styles.example}>Example: {s.example}</Text>
            ) : null}
          </View>
        ))
      )}
    </View>
  );
};

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
});
