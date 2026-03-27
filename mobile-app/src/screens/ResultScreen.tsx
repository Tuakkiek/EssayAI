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
import { Share2 } from "lucide-react-native";
import {
  Colors,
  Radius,
  Shadow,
  Spacing,
  Typography,
} from "../constants/theme";
import { BackButton } from "../components/BackButton";
import { ScoreCard } from "../components/ScoreCard";
import { FeedbackCard } from "../components/FeedbackCard";
import { ProgressIndicator } from "../components/ProgressIndicator";
import { AppButton } from "../components/AppButton";
import {
  essayApi,
  getErrorMessage,
  extractEssay,
  submissionApi,
  studentApi,
} from "../services/api";
import { Essay, GrammarError, Suggestion } from "../types";
import { useAuth } from "../context/AuthContext";

const POLL_MS = 3000;
const MAX_POLLS = 40;

const VIETNAMESE_DIACRITICS = /[ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠƯàáâãèéêìíòóôõùúăđĩũơưẠ-ỹ]/;

function preferNonVietnamese(
  primary?: string,
  fallback?: string,
): string | undefined {
  const primaryText = typeof primary === "string" ? primary.trim() : "";
  const fallbackText = typeof fallback === "string" ? fallback.trim() : "";

  if (!primaryText) return fallbackText || undefined;
  if (!fallbackText) return primaryText;

  const primaryHasVi = VIETNAMESE_DIACRITICS.test(primaryText);
  const fallbackHasVi = VIETNAMESE_DIACRITICS.test(fallbackText);

  if (primaryHasVi && !fallbackHasVi) return fallbackText;
  if (!primaryHasVi && fallbackHasVi) return primaryText;
  return primaryText;
}

// ── Encouragement messages by score ──────────────────────────────────────────
function getEncouragementMessage(score: number): string {
  if (score >= 8) return "Xuất sắc! Bạn đang ở nhóm điểm cao nhất.";
  if (score >= 7) return "Rất tốt! Kỹ năng của bạn khá vững.";
  if (score >= 6.5) return "Cố gắng rất tốt! Bạn đang tiến bộ rõ rệt.";
  if (score >= 6) return "Khá tốt! Hãy tiếp tục luyện tập để nâng cao hơn.";
  if (score >= 5) return "Ổn đấy! Mỗi bài viết sẽ giúp bạn cải thiện hơn.";
  return "Hãy tiếp tục cố gắng! Đây mới chỉ là bước khởi đầu.";
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
    .filter(
      (e) =>
        e.original ||
        e.message ||
        e.corrected ||
        (Array.isArray(e.suggestions) && e.suggestions[0]),
    )
    .slice(0, 6)
    .map((e) => {
      const corrected = preferNonVietnamese(
        e.corrected,
        Array.isArray(e.suggestions) ? e.suggestions[0] : undefined,
      );

      return {
        category: "grammar" as const,
        problem: e.explanation ?? e.message ?? "Xem lại cụm này.",
        suggestion: corrected
          ? `Try: "${corrected}"`
          : "Cân nhắc diễn đạt lại cho rõ ràng hơn.",
        original: e.original,
        corrected,
        detail: e.explanation,
      };
    });
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
    coherence: "clarity",
    structure: "structure",
    argument: "structure",
    general: "clarity",
  };

  return suggestions
    .filter((s) => s.text || s.explanation || s.improved)
    .slice(0, 4)
    .map((s) => ({
      category: catMap[s.category ?? s.type ?? "general"] ?? "clarity",
      problem: s.original ?? "Xem lại phần này.",
      suggestion:
        s.text ??
        s.explanation ??
        s.improved ??
        "Hãy cân nhắc cách cải thiện sau.",
      detail: s.explanation,
    }));
}

export default function ResultScreen() {
  const router = useRouter();
  const { essayId: rawParam } = useLocalSearchParams<{
    essayId?: string | string[];
  }>();
  const essayId = Array.isArray(rawParam) ? rawParam[0] : rawParam;
  const { user } = useAuth();

  const isTeacher = user?.role === "teacher" || user?.role === "admin";
  const historyRoute = isTeacher ? "/teacher/essays" : "/history";

  const [essay, setEssay] = useState<Essay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isNextLoading, setIsNextLoading] = useState(false);

  const handleNextAssignment = async () => {
    if (isTeacher) {
      router.navigate("/" as any);
      return;
    }

    setIsNextLoading(true);
    try {
      const res = await studentApi.getAssignments();
      const assignments = res.data?.data?.assignments ?? res.data?.data ?? [];

      const pending = assignments.find((a: any) => {
        const isSubmitted = !!a.mySubmission;
        const isExpired = new Date(a.dueDate) < new Date();
        return !isSubmitted && !isExpired;
      });

      if (pending) {
        router.push(`/student/assignments/${pending._id}` as any);
      } else {
        router.navigate("/" as any);
      }
    } catch (err) {
      router.navigate("/" as any);
    } finally {
      setIsNextLoading(false);
    }
  };

  // Fade-in for result
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const revealResult = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const fetchEssay = useCallback(
    async (attempt = 0) => {
      if (!essayId) {
        setError("Thiếu mã bài viết. Vui lòng thử lại từ Lịch sử.");
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
            pollRef.current = setTimeout(
              () => fetchEssay(attempt + 1),
              POLL_MS,
            );
          } else {
            setError(
              "Việc chấm bài đang lâu hơn bình thường. Vui lòng kiểm tra Lịch sử sau ít phút.",
            );
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
          setError("Vui lòng kiểm tra Lịch sử để xem kết quả.");
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
      message: `Mình vừa đạt ${score.toFixed(1)} điểm IELTS Writing với Essay AI! 🎉`,
    });
  };

  const elapsed = Math.round((pollCount * POLL_MS) / 1000);

  // ── AI Processing State ────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.simpleHeader}>
          <BackButton
            label={isTeacher ? "Tiến độ" : "Lịch sử"}
            onPress={() => router.replace(historyRoute as any)}
          />
          <Text style={styles.headerTitle} pointerEvents="none">
            Đang chấm bài...
          </Text>
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
      "Có lỗi xảy ra. Vui lòng gửi lại bài viết.";

    return (
      <View style={styles.container}>
        <View style={styles.simpleHeader}>
          <BackButton
            label={isTeacher ? "Tiến độ" : "Lịch sử"}
            onPress={() => router.replace(historyRoute as any)}
          />
          <Text style={styles.headerTitle} pointerEvents="none">
            Rất tiếc!
          </Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorWrap}>
          <View style={[styles.errorCard, Shadow.md]}>
            <Text style={styles.errorEmoji}>😅</Text>
            <Text style={styles.errorTitle}>
              {essay?.status === "error"
                ? "Chấm bài chưa hoàn tất"
                : "Không thể tải kết quả"}
            </Text>
            <Text style={styles.errorMsg}>{msg}</Text>
            <AppButton
              label="Thử lại"
              onPress={() => router.navigate("/essay/input" as any)}
              style={{ marginTop: Spacing.sm }}
            />
            <AppButton
              label="Xem lịch sử"
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
  const finalScore =
    essay.score ?? essay.overallScore ?? essay.overallBand ?? 0;
  const feedbackText =
    [essay.aiFeedback, essay.feedback].find(
      (v) => typeof v === "string" && v.trim(),
    ) ?? "Chưa có nhận xét chi tiết.";

  const grammarFeedback = mapErrors(
    Array.isArray(essay.grammarErrors) ? essay.grammarErrors : [],
  );
  const suggestionFeedback = mapSuggestions(
    Array.isArray(essay.suggestions) ? essay.suggestions : [],
  );
  const allFeedback = [...grammarFeedback, ...suggestionFeedback];

  // Score breakdown short insight
  const bd = essay.scoreBreakdown;
  const criteria = bd
    ? [
        {
          label: "Hoàn thành nhiệm vụ",
          value: bd.taskAchievement ?? 0,
          color: "#6366F1",
        },
        {
          label: "Mạch lạc & liên kết",
          value: bd.coherenceCohesion ?? 0,
          color: "#8B5CF6",
        },
        {
          label: "Từ vựng",
          value: bd.lexicalResource ?? 0,
          color: "#EC4899",
        },
        {
          label: "Ngữ pháp",
          value: bd.grammaticalRangeAccuracy ?? 0,
          color: Colors.warning,
        },
      ]
    : [];
  let lowestCriterion = "";
  if (bd) {
    const lowest = criteria.slice().sort((a, b) => a.value - b.value)[0];
    if (lowest && lowest.value < finalScore) lowestCriterion = lowest.label;
  }

  return (
    <View style={styles.container}>
      <View style={{ height: Spacing.xxxl }} />
      {/* Header */}
      <View style={styles.header}>
        <BackButton
          label={isTeacher ? "Tiến độ" : "Lịch sử"}
          onPress={() => router.replace(historyRoute as any)}
        />
        <Text style={styles.headerTitle} pointerEvents="none">
          Kết quả của bạn
        </Text>
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
              <View style={styles.insightText}>
                <Text style={styles.insightTitle}>Trọng tâm cải thiện</Text>
                <Text style={styles.insightBody}>
                  Tập trung vào{" "}
                  <Text style={styles.insightHighlight}>{lowestCriterion}</Text>{" "}
                  để nâng band tổng thể.
                </Text>
              </View>
            </View>
          ) : null}

          {/* ── 3. AI Feedback narrative ── */}
          <View
            style={[
              styles.feedbackNarrative,
              Shadow.xs,
              { margin: Spacing.md },
            ]}
          >
            <Text style={styles.sectionTitle}>Nhận xét từ AI</Text>
            <Text style={styles.feedbackText}>{feedbackText}</Text>
          </View>

          {/* ── 4. Score breakdown — after encouragement ── */}
          {bd && (
            <View style={[styles.breakdownCard, Shadow.xs]}>
              <Text style={styles.sectionTitle}>Phân tích điểm số</Text>
              {criteria.map(({ label, value, color }) => (
                <View key={label} style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>{label}</Text>
                  <View style={styles.breakdownBarTrack}>
                    <View
                      style={[
                        styles.breakdownBarFill,
                        {
                          width: `${(value / 9) * 100}%` as any,
                          backgroundColor: color,
                        },
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
                Cải thiện ({allFeedback.length})
              </Text>
              <View style={styles.feedbackList}>
                {allFeedback.map((fb, i) => (
                  <FeedbackCard
                    key={i}
                    {...fb}
                    style={{ marginBottom: Spacing.xs }}
                  />
                ))}
              </View>
            </View>
          )}

          {/* ── 6. Next step — single primary action ── */}
          <View style={styles.nextStep}>
            <AppButton
              label="Làm bài tiếp theo"
              onPress={handleNextAssignment}
              loading={isNextLoading}
              size="lg"
            />
            <AppButton
              label="Xem tất cả kết quả"
              onPress={() => router.replace(historyRoute as any)}
              variant="ghost"
              size="md"
              style={{ marginBottom: Spacing.xxxl }}
            />
          </View>

          <View style={{ height: Spacing.xxxl }} />
        </Animated.View>
      </ScrollView>
      {/* <View style={{ height: Spacing.xxxl * 2 }} /> */}
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
    position: "relative",
  },
  simpleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    position: "relative",
  },
  shareBtn: { padding: Spacing.xs },
  headerTitle: {
    ...Typography.title3,
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
  },

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
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    marginHorizontal: Spacing.md,
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
    marginHorizontal: Spacing.md,
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
    marginHorizontal: Spacing.md,
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
    marginBottom: Spacing.sm,
  },

  // Feedback section
  feedbackSection: {
    gap: Spacing.sm,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
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
