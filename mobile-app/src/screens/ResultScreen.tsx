import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Colors, Spacing, Typography, Radius, Shadow } from "@/constants/theme";
import { ScoreBadge } from "../components/ScoreBadge";
import ScoreBreakdownCard from "../components/ScoreBreakdownCard";
import { GrammarErrorCard } from "../components/GrammarErrorCard";
import { SuggestionsCard } from "../components/SuggestionsCard";
import { essayApi, getErrorMessage, extractEssay } from "../services/api";
import { Essay } from "../types";
import { useBack } from "../hooks/useBack";

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 40; // ~2 minutes max

export default function ResultScreen() {
  const router = useRouter();
  const goBack = useBack("/");
  const { essayId } = useLocalSearchParams<{
    essayId: string;
    score: string;
  }>();

  const [essay, setEssay] = useState<Essay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchEssay = useCallback(
    async (attempt = 0) => {
      try {
        const res = await essayApi.getById(essayId);

        // Guard: 304 Not Modified returns empty body â€” skip and retry
        // res.data can be "", null, or {} depending on axios version
        const raw = res.data;
        const data = extractEssay(raw);

        if (data) {
          console.log("[ResultScreen] Extracted essay data:", JSON.stringify(data, null, 2));
        } else {
          console.log("[ResultScreen] Could not extract essay. Raw response:", JSON.stringify(raw, null, 2));
        }

        if (!data) {
          // Empty body â€” essay likely hasn't changed yet, poll again
          if (attempt < MAX_POLL_ATTEMPTS) {
            setIsPolling(true);
            setPollCount(attempt + 1);
            pollRef.current = setTimeout(
              () => fetchEssay(attempt + 1),
              POLL_INTERVAL_MS,
            );
          } else {
            setLoading(false);
            setError(
              "Grading is taking longer than expected. Please check your History in a few minutes.",
            );
          }
          return;
        }

        setEssay(data);

        if (
          data.status === "scored" ||
          data.status === "graded" ||
          data.status === "error"
        ) {
          // Grading finished â€” stop polling
          setIsPolling(false);
          setLoading(false);
        } else if (attempt < MAX_POLL_ATTEMPTS) {
          // Still grading â€” poll again
          setIsPolling(true);
          setPollCount(attempt + 1);
          pollRef.current = setTimeout(
            () => fetchEssay(attempt + 1),
            POLL_INTERVAL_MS,
          );
        } else {
          setIsPolling(false);
          setLoading(false);
          setError(
            "Grading is taking longer than expected. Please check your History in a few minutes.",
          );
        }
      } catch (err) {
        setError(getErrorMessage(err));
        setLoading(false);
        setIsPolling(false);
      }
    },
    [essayId],
  );

  useEffect(() => {
    fetchEssay(0);
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [fetchEssay]);

  const handleShare = async () => {
    const finalScore =
      essay?.score ?? essay?.overallScore ?? essay?.overallBand;
    if (!finalScore) return;
    await Share.share({
      message: `I just scored ${finalScore.toFixed(1)} on my IELTS essay using Essay AI! ðŸŽ¯`,
    });
  };

  // â”€â”€ Grading in progress â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (loading || isPolling) {
    const dots = ".".repeat((pollCount % 3) + 1);
    const elapsed = Math.round((pollCount * POLL_INTERVAL_MS) / 1000);
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 52, marginBottom: Spacing.xl }}>ðŸ¤–</Text>
        <ActivityIndicator
          size="large"
          color={Colors.primary}
          style={{ marginBottom: Spacing.lg }}
        />
        <Text style={[Typography.heading3, { textAlign: "center" }]}>
          Grading your essay{dots}
        </Text>
        <Text
          style={[
            Typography.body,
            {
              color: Colors.textSecondary,
              textAlign: "center",
              marginTop: Spacing.sm,
            },
          ]}
        >
          Our AI examiner is reading through your essay.{"\n"}This usually takes
          15â€“40 seconds.
        </Text>
        {elapsed > 10 && (
          <Text
            style={[
              Typography.caption,
              { color: Colors.textMuted, marginTop: Spacing.md },
            ]}
          >
            {elapsed}s elapsedâ€¦
          </Text>
        )}
      </View>
    );
  }

  // â”€â”€ Error state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (error || !essay) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 48, marginBottom: Spacing.lg }}>ðŸ˜•</Text>
        <Text style={Typography.heading3}>Something went wrong</Text>
        <Text
          style={[
            Typography.body,
            {
              color: Colors.textSecondary,
              textAlign: "center",
              marginTop: Spacing.sm,
            },
          ]}
        >
          {error ?? "Could not load results"}
        </Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => router.push("/history" as any)}
        >
          <Text style={styles.retryText}>Check History</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.retryBtn,
            { backgroundColor: Colors.surfaceAlt, marginTop: Spacing.sm },
          ]}
          onPress={goBack}
        >
          <Text style={[styles.retryText, { color: Colors.primary }]}>
            Quay lại
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // â”€â”€ AI grading failed â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (essay.status === "error") {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 48, marginBottom: Spacing.lg }}>âš ï¸</Text>
        <Text style={Typography.heading3}>Grading Failed</Text>
        <Text
          style={[
            Typography.body,
            {
              color: Colors.textSecondary,
              textAlign: "center",
              marginTop: Spacing.sm,
              paddingHorizontal: Spacing.xl,
            },
          ]}
        >
          {essay.errorMessage ??
            "The AI grader encountered an error. Please try submitting your essay again."}
        </Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => router.navigate("/essay/input" as any)}
        >
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.retryBtn,
            { backgroundColor: Colors.surfaceAlt, marginTop: Spacing.sm },
          ]}
          onPress={() => router.push("/history" as any)}
        >
          <Text style={[styles.retryText, { color: Colors.primary }]}>
            View History
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const finalScore = essay.score ?? essay.overallScore ?? essay.overallBand;
  const scoreColor = finalScore != null
    ? finalScore >= 7
      ? Colors.success
      : finalScore >= 6
        ? Colors.warning
        : Colors.error
    : Colors.textMuted;

  // â”€â”€ Result â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <View style={styles.container}>
      <View style={[styles.header, { borderBottomColor: Colors.border }]}>
        <TouchableOpacity
          onPress={() => router.push("/")}
          style={styles.doneBtn}
        >
          <Text style={styles.doneBtnText}>â† Home</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Results</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
          <Text style={styles.shareText}>Share</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.heroCard,
            { borderTopColor: scoreColor, borderTopWidth: 4 },
          ]}
        >
          <Text style={styles.heroLabel}>IELTS Band Score</Text>
          {finalScore != null ? (
            <ScoreBadge score={finalScore} size="lg" />
          ) : (
            <Text style={[Typography.body, { color: Colors.textMuted }]}>
              Score not available
            </Text>
          )}
          <View style={styles.metaRow}>
            <Text style={styles.metaChip}>ðŸ“ {essay.wordCount} words</Text>
            <Text style={styles.metaChip}>
              {essay.taskType === "task2"
                ? "Task 2 Essay"
                : "Task 1 Description"}
            </Text>
            {essay.processingTimeMs && (
              <Text style={styles.metaChip}>
                â± {(essay.processingTimeMs / 1000).toFixed(1)}s
              </Text>
            )}
          </View>
        </View>

        {(essay.aiFeedback || essay.feedback) && (
          <View style={styles.feedbackCard}>
            <Text style={styles.feedbackTitle}>ðŸ“‹ Examiner Feedback</Text>
            <Text style={styles.feedbackText}>{essay.aiFeedback ?? essay.feedback}</Text>
          </View>
        )}

        {essay.scoreBreakdown && finalScore != null && (
          <ScoreBreakdownCard
            breakdown={essay.scoreBreakdown}
            overallBand={finalScore}
          />
        )}

        <GrammarErrorCard errors={essay.grammarErrors ?? []} />
        <SuggestionsCard suggestions={essay.suggestions ?? []} />

        {finalScore != null && (
          <TouchableOpacity
            style={styles.improveBtn}
            onPress={() =>
              router.push({
                pathname: "/improvement",
                params: { essayId: essay._id },
              } as any)
            }
            activeOpacity={0.85}
          >
            <Text style={styles.improveBtnText}>ðŸš€ AI Improvement Tools</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.tryAgainBtn}
          onPress={() => router.push("/essay/input")}
          activeOpacity={0.85}
        >
          <Text style={styles.tryAgainText}>âœï¸ Write Another Essay</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
    paddingTop: 52,
    paddingBottom: 12,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
  },
  doneBtn: { paddingVertical: 4, paddingRight: 12 },
  doneBtnText: { ...Typography.body, color: Colors.primary, fontWeight: "600" },
  headerTitle: { ...Typography.heading3 },
  shareBtn: { paddingVertical: 4, paddingLeft: 12 },
  shareText: { ...Typography.body, color: Colors.primary, fontWeight: "600" },
  content: { padding: Spacing.lg },
  heroCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: "center",
    marginBottom: Spacing.lg,
    ...Shadow.md,
  },
  heroLabel: {
    ...Typography.caption,
    letterSpacing: 1,
    textTransform: "uppercase",
    fontWeight: "700",
    marginBottom: Spacing.md,
  },
  metaRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: Spacing.lg,
  },
  metaChip: {
    ...Typography.caption,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    fontWeight: "500",
  },
  feedbackCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  feedbackTitle: { ...Typography.heading3, marginBottom: Spacing.md },
  feedbackText: {
    ...Typography.body,
    lineHeight: 24,
    color: Colors.textSecondary,
  },
  retryBtn: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.xxxl,
    paddingVertical: 14,
  },
  retryText: { ...Typography.body, color: Colors.surface, fontWeight: "700" },
  improveBtn: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.primary,
    marginTop: Spacing.xl,
  },
  improveBtnText: { fontSize: 16, fontWeight: "700", color: Colors.primary },
  tryAgainBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: "center",
    ...Shadow.md,
    marginTop: Spacing.sm,
  },
  tryAgainText: { fontSize: 16, fontWeight: "700", color: Colors.surface },
});



