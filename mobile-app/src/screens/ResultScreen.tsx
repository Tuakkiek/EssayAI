/**
 * ResultScreen — AI Processing → Score Reveal → Feedback
 *
 * Spec order: Celebration → Score (count-up) → Improvement summary → Detail
 * Never show analytics first.
 * Encouragement before data.
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Animated,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ChevronLeft, Share2 } from "lucide-react-native";
import { Colors, Radius, Shadow, Spacing, Typography } from "../constants/theme";
import { ScoreCard } from "../components/ScoreCard";
import { FeedbackCard } from "../components/FeedbackCard";
import { ProgressIndicator } from "../components/ProgressIndicator";
import { AppButton } from "../components/AppButton";
import { essayApi, getErrorMessage, extractEssay, submissionApi } from "../services/api";
import { Essay, GrammarError, Suggestion } from "../types";
import { useAuth } from "../context/AuthContext";

const POLL_MS = 3000;
const MAX_POLLS = 40;

// ── Encouragement messages by score ──────────────────────────────────────────
function getEncouragementMessage(score: number): string {
  if (score >= 8)   return "Outstanding! You're in the top tier.";
  if (score >= 7)   return "Excellent work! Your skills are strong.";
  if (score >= 6.5) return "Great effort! You're making real progress.";
  if (score >= 6)   return "Good job! Keep practicing to level up.";
  if (score >= 5)   return "Nice try! Every essay makes you stronger.";
  return "Keep going! This is just the beginning of your journey.";
}

// ── Map grammar errors → FeedbackCard props ──────────────────────────────────
function mapErrors(errors: GrammarError[]): Array<{
  category: "grammar";
  problem: string;
  suggestion: string;
  original?: string;
  corrected?: string;
  detail?: string;
}> {
  return errors
    .filter((e) => e.original || e.message)
    .slice(0, 6)
    .map((e) => ({
      category: "grammar" as const,
      problem: e.explanation ?? e.message ?? "Review this phrase.",
      suggestion:
        e.corrected
          ? `Try: "${e.corrected}"`
          : "Consider rephrasing for clarity.",
      original: e.original,
      corrected: e.corrected,
      detail: e.explanation,
    }));
}

// ── Map suggestions → FeedbackCard props ─────────────────────────────────────
function mapSuggestions(suggestions: Suggestion[]): Array<{
  category: "vocabulary" | "clarity" | "structure";
  problem: string;
  suggestion: string;
  detail?: string;
}> {
  const catMap: Record<string, "vocabulary" | "clarity" | "structure"> = {
    vocabulary: "vocabulary",
    coherence:  "clarity",
    structure:  "structure",
    argument:   "structure",
    general:    "clarity",
  };

  return suggestions
    .filter((s) => s.text || s.explanation)
    .slice(0, 4)
    .map((s) => ({
      category: catMap[s.category ?? s.type ?? "general"] ?? "clarity",
      problem:  s.original ?? "Review this area.",
      suggestion: s.text ?? s.explanation ?? s.improved ?? "Consider this improvement.",
      detail: s.explanation,
    }));
}

export default function ResultScreen() {
  const router = useRouter();
  const { essayId: rawParam } = useLocalSearchParams<{ essayId?: string | string[] }>();
  const essayId = Array.isArray(rawParam) ? rawParam[0] : rawParam;
  const { user } = useAuth();

  const isTeacher = user?.role === "teacher" || user?.role === "admin";
  const historyRoute = isTeacher ? "/teacher/essays" : "/history";

  const [essay, setEssay] = useState<Essay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fade-in for result
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const revealResult = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const fetchEssay = useCallback(
    async (attempt = 0) => {
      if (!essayId) {
        setError("Essay ID missing. Please try again from History.");
        setLoading(false);
        return;
      }
      try {
        const res = isTeacher
          ? await submissionApi.getById(essayId)
          : await essayApi.getById(essayId);
        const data = extractEssay(res.data);

        if (!data) {
          if (attempt < MAX_POLLS) {
            setPollCount(attempt + 1);
            pollRef.current = setTimeout(() => fetchEssay(attempt + 1), POLL_MS);
          } else {
            setError("Grading is taking longer than usual. Check History in a moment.");
            setLoading(false);
          }
          return;
        }

        setEssay(data);

        if (["scored", "graded", "error"].includes(data.status)) {
          setLoading(false);
          if (data.status !== "error") revealResult();
        } else if (attempt < MAX_POLLS) {
          setPollCount(attempt + 1);
          pollRef.current = setTimeout(() => fetchEssay(attempt + 1), POLL_MS);
        } else {
          setLoading(false);
          setError("Please check History for your results.");
        }
      } catch (err) {
        setError(getErrorMessage(err));
        setLoading(false);
      }
    },
    [essayId, isTeacher, revealResult],
  );

  useEffect(() => {
    fetchEssay(0);
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [fetchEssay]);

  const handleShare = async () => {
    const score = essay?.score ?? essay?.overallScore ?? essay?.overallBand;
    if (!score) return;
    await Share.share({
      message: `I just scored ${score.toFixed(1)} on my IELTS Writing with Essay AI! 🎉`,
    });
  };

  const elapsed = Math.round((pollCount * POLL_MS) / 1000);

  // ── AI Processing State ────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.simpleHeader}>
          <TouchableOpacity
            onPress={() => router.replace(historyRoute as any)}
            style={styles.backBtn}
          >
            <ChevronLeft size={24} color={Colors.text} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Grading...</Text>
          <View style={{ width: 40 }} />
        </View>
        <ProgressIndicator visible elapsed={elapsed} />
      </View>
    );
  }

  // ── Error State ────────────────────────────────────────────────────────────
  if (error || !essay || essay.status === "error") {
    const msg =
      essay?.errorMessage ??
      error ??
      "Something went wrong. Please resubmit your essay.";

    return (
      <View style={styles.container}>
        <View style={styles.simpleHeader}>
          <TouchableOpacity onPress={() => router.replace(historyRoute as any)} style={styles.backBtn}>
            <ChevronLeft size={24} color={Colors.text} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Oops!</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorWrap}>
          <View style={[styles.errorCard, Shadow.md]}>
            <Text style={styles.errorEmoji}>😅</Text>
            <Text style={styles.errorTitle}>
              {essay?.status === "error" ? "Grading didn't complete" : "Couldn't load result"}
            </Text>
            <Text style={styles.errorMsg}>{msg}</Text>
            <AppButton
              label="Try Again"
              onPress={() => router.navigate("/essay/input" as any)}
              style={{ marginTop: Spacing.sm }}
            />
            <AppButton
              label="See History"
              onPress={() => router.replace(historyRoute as any)}
              variant="ghost"
              style={{ marginTop: Spacing.xs }}
            />
          </View>
        </View>
      </View>
    );
  }

  // ── Result State ───────────────────────────────────────────────────────────
  const finalScore = essay.score ?? essay.overallScore ?? essay.overallBand ?? 0;
  const feedbackText = [essay.aiFeedback, essay.feedback].find(
    (v) => typeof v === "string" && v.trim(),
  ) ?? "No detailed feedback provided.";

  const grammarFeedback = mapErrors(Array.isArray(essay.grammarErrors) ? essay.grammarErrors : []);
  const suggestionFeedback = mapSuggestions(Array.isArray(essay.suggestions) ? essay.suggestions : []);
  const allFeedback = [...grammarFeedback, ...suggestionFeedback];

  // Score breakdown short insight
  const bd = essay.scoreBreakdown;
  let lowestCriterion = "";
  if (bd) {
    const scores = [
      { key: "Task Achievement", val: bd.taskAchievement ?? 0 },
      { key: "Coherence",        val: bd.coherenceCohesion ?? 0 },
      { key: "Vocabulary",       val: bd.lexicalResource ?? 0 },
      { key: "Grammar",          val: bd.grammaticalRangeAccuracy ?? 0 },
    ];
    const lowest = scores.sort((a, b) => a.val - b.val)[0];
    if (lowest.val < finalScore) lowestCriterion = lowest.key;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace(historyRoute as any)} style={styles.backBtn}>
          <ChevronLeft size={24} color={Colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Result</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
          <Share2 size={20} color={Colors.primary} strokeWidth={2.2} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >
          {/* ── 1. Score Reveal — encouragement first per spec ── */}
          <ScoreCard
            score={finalScore}
            animate
            message={getEncouragementMessage(finalScore)}
          />

          {/* ── 2. Improvement summary (one insight) ── */}
          {lowestCriterion ? (
            <View style={[styles.insightCard, Shadow.xs]}>
              <Text style={styles.insightEmoji}>💡</Text>
              <View style={styles.insightText}>
                <Text style={styles.insightTitle}>Focus area</Text>
                <Text style={styles.insightBody}>
                  Work on <Text style={styles.insightHighlight}>{lowestCriterion}</Text> to boost your overall band.
                </Text>
              </View>
            </View>
          ) : null}

          {/* ── 3. AI Feedback narrative ── */}
          <View style={[styles.feedbackNarrative, Shadow.xs]}>
            <Text style={styles.sectionTitle}>AI Examiner Feedback</Text>
            <Text style={styles.feedbackText}>{feedbackText}</Text>
          </View>

          {/* ── 4. Score breakdown — after encouragement ── */}
          {bd && (
            <View style={[styles.breakdownCard, Shadow.xs]}>
              <Text style={styles.sectionTitle}>Score Breakdown</Text>
              {[
                { label: "Task Achievement", value: bd.taskAchievement ?? 0, color: "#6366F1" },
                { label: "Coherence & Cohesion", value: bd.coherenceCohesion ?? 0, color: "#8B5CF6" },
                { label: "Vocabulary", value: bd.lexicalResource ?? 0, color: "#EC4899" },
                { label: "Grammar", value: bd.grammaticalRangeAccuracy ?? 0, color: Colors.warning },
              ].map(({ label, value, color }) => (
                <View key={label} style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>{label}</Text>
                  <View style={styles.breakdownBarTrack}>
                    <View
                      style={[
                        styles.breakdownBarFill,
                        { width: `${(value / 9) * 100}%` as any, backgroundColor: color },
                      ]}
                    />
                  </View>
                  <Text style={[styles.breakdownScore, { color }]}>
                    {value.toFixed(1)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* ── 5. Detailed feedback cards ── */}
          {allFeedback.length > 0 && (
            <View style={styles.feedbackSection}>
              <Text style={styles.sectionTitle}>
                Improvements ({allFeedback.length})
              </Text>
              <View style={styles.feedbackList}>
                {allFeedback.map((fb, i) => (
                  <FeedbackCard key={i} {...fb} />
                ))}
              </View>
            </View>
          )}

          {/* ── 6. Next step — single primary action ── */}
          <View style={styles.nextStep}>
            <AppButton
              label="Write Another Essay"
              onPress={() => router.navigate("/essay/input" as any)}
              size="lg"
            />
            <AppButton
              label="See All Results"
              onPress={() => router.replace(historyRoute as any)}
              variant="ghost"
              size="md"
            />
          </View>

          <View style={{ height: Spacing.xxxl }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Headers
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  simpleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backBtn: { padding: Spacing.xs },
  shareBtn: { padding: Spacing.xs },
  headerTitle: { ...Typography.title3 },

  // Scroll
  scroll: {
    padding: Spacing.md,
    gap: Spacing.md,
  },

  // Insight card
  insightCard: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    flexDirection: "row",
    gap: Spacing.sm,
    alignItems: "center",
  },
  insightEmoji: { fontSize: 28 },
  insightText: { flex: 1 },
  insightTitle: {
    ...Typography.caption,
    color: Colors.primaryDark,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  insightBody: {
    ...Typography.bodySmall,
    color: Colors.primaryDark,
    lineHeight: 20,
  },
  insightHighlight: { fontWeight: "700" },

  // Feedback narrative
  feedbackNarrative: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  feedbackText: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 26,
  },

  // Score breakdown
  breakdownCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  breakdownLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    width: 130,
  },
  breakdownBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
    overflow: "hidden",
  },
  breakdownBarFill: { height: "100%", borderRadius: Radius.full },
  breakdownScore: {
    ...Typography.caption,
    fontWeight: "700",
    width: 30,
    textAlign: "right",
  },

  // Section title
  sectionTitle: {
    ...Typography.title3,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },

  // Feedback section
  feedbackSection: { gap: Spacing.sm },
  feedbackList: { gap: Spacing.sm },

  // Next step
  nextStep: { gap: Spacing.sm, paddingTop: Spacing.sm },

  // Error state
  errorWrap: {
    flex: 1,
    justifyContent: "center",
    padding: Spacing.xl,
  },
  errorCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xxl,
    padding: Spacing.xl,
    alignItems: "center",
    gap: Spacing.sm,
  },
  errorEmoji: { fontSize: 48 },
  errorTitle: {
    ...Typography.title2,
    textAlign: "center",
  },
  errorMsg: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
});
