import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface ScoreBreakdown {
  taskAchievement: number;
  coherenceCohesion: number;
  lexicalResource: number;
  // FIX #6: was "grammaticalRange" — backend returns "grammaticalRangeAccuracy"
  grammaticalRangeAccuracy: number;
}

interface ScoreBreakdownCardProps {
  breakdown: ScoreBreakdown;
  overallBand: number;
}

const CRITERIA = [
  { key: "taskAchievement",         label: "Task Achievement",              color: "#6366F1" },
  { key: "coherenceCohesion",       label: "Coherence & Cohesion",          color: "#8B5CF6" },
  { key: "lexicalResource",         label: "Lexical Resource",              color: "#EC4899" },
  // FIX: key updated to match backend response field
  { key: "grammaticalRangeAccuracy", label: "Grammatical Range & Accuracy", color: "#F59E0B" },
] as const;

function ScoreBar({ score, color }: { score: number; color: string }) {
  const pct = (score / 9) * 100;
  return (
    <View style={styles.barTrack}>
      <View style={[styles.barFill, { width: `${pct}%` as any, backgroundColor: color }]} />
    </View>
  );
}

export default function ScoreBreakdownCard({
  breakdown,
  overallBand,
}: ScoreBreakdownCardProps) {
  return (
    <View style={styles.card}>
      {/* Overall */}
      <View style={styles.overallRow}>
        <Text style={styles.overallLabel}>Overall Band</Text>
        <View style={styles.overallBadge}>
          <Text style={styles.overallScore}>{overallBand.toFixed(1)}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Criteria */}
      {CRITERIA.map(({ key, label, color }) => {
        // FIX: directly access correct key — no more undefined
        const score: number = breakdown[key] ?? 0;
        return (
          <View key={key} style={styles.criteriaRow}>
            <View style={styles.criteriaHeader}>
              <Text style={styles.criteriaLabel}>{label}</Text>
              <Text style={[styles.criteriaScore, { color }]}>
                {score.toFixed(1)}
              </Text>
            </View>
            <ScoreBar score={score} color={color} />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  overallRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  overallLabel: { fontSize: 16, fontWeight: "700", color: "#111827" },
  overallBadge: {
    backgroundColor: "#EEF2FF",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  overallScore: { fontSize: 22, fontWeight: "800", color: "#4F46E5" },
  divider: { height: 1, backgroundColor: "#F3F4F6" },
  criteriaRow: { gap: 6 },
  criteriaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  criteriaLabel: { fontSize: 13, color: "#374151", fontWeight: "500" },
  criteriaScore: { fontSize: 15, fontWeight: "700" },
  barTrack: {
    height: 6,
    backgroundColor: "#F3F4F6",
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 3 },
});
