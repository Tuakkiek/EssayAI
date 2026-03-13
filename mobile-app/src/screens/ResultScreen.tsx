import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  ActivityIndicator,
  Animated,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Colors, Spacing, Typography, Radius, Shadow } from "@/constants/theme";
import { ScoreBadge } from "../components/ScoreBadge";
import ScoreBreakdownCard from "../components/ScoreBreakdownCard";
import { GrammarErrorCard } from "../components/GrammarErrorCard";
import { SuggestionsCard } from "../components/SuggestionsCard";
import {
  essayApi,
  getErrorMessage,
  extractEssay,
  submissionApi,
} from "../services/api";
import { Essay } from "../types";
import { BackButton } from "../components/BackButton";
import { useAuth } from "../context/AuthContext";

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 40;

// Score accent colors
const getScoreTheme = (score: number | null | undefined) => {
  if (score == null) return { accent: "#94A3B8", bg: "#F1F5F9", label: "—" };
  if (score >= 7.5)
    return { accent: "#0EA5E9", bg: "#E0F2FE", label: "Xuất sắc" };
  if (score >= 7) return { accent: "#10B981", bg: "#D1FAE5", label: "Tốt" };
  if (score >= 6) return { accent: "#F59E0B", bg: "#FEF3C7", label: "Khá" };
  if (score >= 5)
    return { accent: "#F97316", bg: "#FFEDD5", label: "Trung bình" };
  return { accent: "#EF4444", bg: "#FEE2E2", label: "Cần cải thiện" };
};

export default function ResultScreen() {
  const router = useRouter();
  const { essayId: essayIdParam } = useLocalSearchParams<{
    essayId?: string | string[];
    score?: string;
  }>();
  const essayId = Array.isArray(essayIdParam) ? essayIdParam[0] : essayIdParam;

  const { user } = useAuth();
  const isTeacher = user?.role === "teacher" || user?.role === "admin";
  const historyRoute = isTeacher ? "/teacher/essays" : "/history";
  const historyLabel = isTeacher ? "Bài luận" : "Lịch sử";
  const [essay, setEssay] = useState<Essay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fade-in animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  const animateIn = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 480,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 480,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleBack = useCallback(() => {
    router.replace(historyRoute as any);
  }, [router, historyRoute]);

  const fetchEssay = useCallback(
    async (attempt = 0) => {
      try {
        if (!essayId) {
          setError("Thiếu mã bài viết. Vui lòng mở lại từ Lịch sử.");
          setLoading(false);
          setIsPolling(false);
          return;
        }
        const isTeacher = user?.role === "teacher" || user?.role === "admin";
        const res = isTeacher
          ? await submissionApi.getById(essayId)
          : await essayApi.getById(essayId);

        const raw = res.data;
        const data = extractEssay(raw);

        if (!data) {
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
              `Quá trình chấm điểm đang mất nhiều thời gian hơn dự kiến. Vui lòng kiểm tra lại trong mục ${historyLabel} sau ít phút.`,
            );
          }
          return;
        }

        setEssay(data);

        if (["scored", "graded", "error"].includes(data.status)) {
          setIsPolling(false);
          setLoading(false);
          animateIn();
        } else if (attempt < MAX_POLL_ATTEMPTS) {
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
            `Hệ thống đang bận. Vui lòng kiểm tra kết quả trong mục ${historyLabel} sau.`,
          );
        }
      } catch (err) {
        setError(getErrorMessage(err));
        setLoading(false);
        setIsPolling(false);
      }
    },
    [essayId, user?.role, historyLabel, animateIn],
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
      message: `Tôi vừa đạt được ${finalScore.toFixed(1)} điểm cho bài viết IELTS của mình nhờ Essay AI!`,
    });
  };

  // â”€â”€â”€ Loading state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (loading || isPolling) {
    const dots = ".".repeat((pollCount % 3) + 1);
    const elapsed = Math.round((pollCount * POLL_INTERVAL_MS) / 1000);
    return (
      <View style={styles.center}>
        <View style={styles.loadingCard}>
          <ActivityIndicator
            size="large"
            color="#0EA5E9"
            style={{ marginBottom: 20 }}
          />
          <Text style={styles.loadingTitle}>Đang chấm bài{dots}</Text>
          <Text style={styles.loadingSubtitle}>
            Giám khảo AI đang phân tích chi tiết bài viết của bạn.{"\n"}Thường
            mất từ 15–40 giây.
          </Text>
          {elapsed > 10 && (
            <View style={styles.elapsedPill}>
              <Text style={styles.elapsedText}>{elapsed}s</Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  // â”€â”€â”€ Error state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (error || !essay) {
    return (
      <View style={styles.center}>
        <View style={styles.errorCard}>
          <View style={styles.errorIconWrap}>
            <Text style={styles.errorIcon}>!</Text>
          </View>
          <Text style={styles.errorTitle}>Không thể tải kết quả</Text>
          <Text style={styles.errorBody}>
            {error ?? "Không thể tải kết quả bài viết"}
          </Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.replace(historyRoute as any)}
          >
            <Text style={styles.primaryBtnText}>Xem {historyLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ghostBtn} onPress={handleBack}>
            <Text style={styles.ghostBtnText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // â”€â”€â”€ Grader error state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (essay.status === "error") {
    return (
      <View style={styles.center}>
        <View style={styles.errorCard}>
          <View style={[styles.errorIconWrap, { backgroundColor: "#FEF3C7" }]}>
            <Text style={[styles.errorIcon, { color: "#F59E0B" }]}>~</Text>
          </View>
          <Text style={styles.errorTitle}>Chấm điểm thất bại</Text>
          <Text style={styles.errorBody}>
            {essay.errorMessage ??
              "Giám khảo AI gặp sự cố kỹ thuật. Vui lòng thử gửi lại bài viết."}
          </Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.navigate("/essay/input" as any)}
          >
            <Text style={styles.primaryBtnText}>Thử lại</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.ghostBtn}
            onPress={() => router.replace(historyRoute as any)}
          >
            <Text style={styles.ghostBtnText}>Xem {historyLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const finalScore = essay.score ?? essay.overallScore ?? essay.overallBand;
  const theme = getScoreTheme(finalScore);
  const feedbackText =
    [essay.aiFeedback, essay.feedback].find(
      (value) => typeof value === "string" && value.trim().length > 0,
    ) ?? "Chưa có nhận xét từ giám khảo.";
  const originalText =
    typeof essay.originalText === "string" && essay.originalText.trim()
      ? essay.originalText.trim()
      : typeof essay.text === "string" && essay.text.trim()
        ? essay.text.trim()
        : "";
  const grammarErrors = Array.isArray(essay.grammarErrors)
    ? essay.grammarErrors
    : [];
  const suggestions = Array.isArray(essay.suggestions) ? essay.suggestions : [];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton label={historyLabel} onPress={handleBack} />
        <Text style={styles.headerTitle}>Kết quả</Text>
        <TouchableOpacity
          onPress={handleShare}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.headerAction}>Chia sẻ</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >
          {/* â”€â”€ Hero score card â”€â”€ */}
          <View style={[styles.heroCard, { borderTopColor: theme.accent }]}>
            {/* Score level label */}
            <View style={[styles.levelPill, { backgroundColor: theme.bg }]}>
              <Text style={[styles.levelText, { color: theme.accent }]}>
                {theme.label}
              </Text>
            </View>

            {/* Score number */}
            {finalScore != null ? (
              <View style={styles.scoreWrap}>
                <ScoreBadge score={finalScore} size="lg" />
              </View>
            ) : (
              <Text style={styles.noScore}>Không có điểm</Text>
            )}

            {/* Meta chips */}
            <View style={styles.metaRow}>
              <View style={styles.metaChip}>
                <Text style={styles.metaChipText}>{essay.wordCount} từ</Text>
              </View>
              {essay.processingTimeMs && (
                <View style={styles.metaChip}>
                  <Text style={styles.metaChipText}>
                    {(essay.processingTimeMs / 1000).toFixed(1)}s
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* â”€â”€ Score breakdown â”€â”€ */}
          {essay.scoreBreakdown && finalScore != null && (
            <ScoreBreakdownCard
              breakdown={essay.scoreBreakdown}
              overallBand={finalScore}
            />
          )}

          {originalText ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View
                  style={[styles.sectionDot, { backgroundColor: theme.accent }]}
                />
                <Text style={styles.sectionTitle}>Bài viết gốc</Text>
              </View>
              <Text style={styles.originalText}>{originalText}</Text>
            </View>
          ) : null}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View
                style={[styles.sectionDot, { backgroundColor: theme.accent }]}
              />
              <Text style={styles.sectionTitle}>Nhận xét từ Giám khảo</Text>
            </View>
            <Text style={styles.feedbackText}>{feedbackText}</Text>
          </View>

          {/* â”€â”€ Grammar errors â”€â”€ */}
          <GrammarErrorCard errors={grammarErrors} />

          {/* â”€â”€ Suggestions â”€â”€ */}
          <SuggestionsCard suggestions={suggestions} />

          <View style={{ height: 48 }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// â”€â”€â”€ Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const SURFACE = "#FFFFFF";
const BG = "#F8FAFC";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#64748B";
const TEXT_MUTED = "#94A3B8";
const BORDER = "#E2E8F0";
const ACCENT = "#0EA5E9";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: BG,
    padding: 24,
  },

  // â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: SURFACE,
    paddingTop: 54,
    paddingBottom: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headerBack: {
    fontSize: 15,
    color: ACCENT,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: TEXT_PRIMARY,
    letterSpacing: -0.3,
  },
  headerAction: {
    fontSize: 15,
    color: ACCENT,
    fontWeight: "600",
    letterSpacing: -0.2,
  },

  // â”€â”€ Scroll â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  scroll: {
    padding: 16,
    paddingTop: 20,
  },

  // â”€â”€ Hero card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  heroCard: {
    backgroundColor: SURFACE,
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: "center",
    marginBottom: 14,
    borderTopWidth: 3,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  levelPill: {
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 20,
  },
  levelText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  scoreWrap: {
    alignItems: "center",
    marginBottom: 8,
  },
  scoreSubLabel: {
    fontSize: 13,
    color: TEXT_MUTED,
    marginTop: 6,
    letterSpacing: 0.2,
  },
  noScore: {
    fontSize: 15,
    color: TEXT_MUTED,
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 20,
  },
  metaChip: {
    backgroundColor: BG,
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: BORDER,
  },
  metaChipText: {
    fontSize: 12,
    fontWeight: "500",
    color: TEXT_SECONDARY,
    letterSpacing: 0.1,
  },

  // â”€â”€ Section (feedback) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  section: {
    backgroundColor: SURFACE,
    borderRadius: 20,
    padding: 22,
    marginBottom: 14,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 8,
  },
  sectionDot: {
    width: 4,
    height: 20,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: TEXT_PRIMARY,
    letterSpacing: -0.3,
  },
  feedbackText: {
    fontSize: 15,
    lineHeight: 25,
    color: TEXT_SECONDARY,
    letterSpacing: 0.1,
  },
  originalText: {
    fontSize: 15,
    lineHeight: 24,
    color: TEXT_PRIMARY,
    letterSpacing: 0.1,
  },

  // â”€â”€ Loading card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  loadingCard: {
    backgroundColor: SURFACE,
    borderRadius: 24,
    padding: 36,
    alignItems: "center",
    width: "100%",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: TEXT_PRIMARY,
    letterSpacing: -0.4,
    marginBottom: 10,
    textAlign: "center",
  },
  loadingSubtitle: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    lineHeight: 22,
    textAlign: "center",
    letterSpacing: 0.1,
  },
  elapsedPill: {
    marginTop: 20,
    backgroundColor: "#F1F5F9",
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  elapsedText: {
    fontSize: 12,
    fontWeight: "600",
    color: TEXT_MUTED,
    letterSpacing: 0.5,
  },

  // â”€â”€ Error card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  errorCard: {
    backgroundColor: SURFACE,
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    width: "100%",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  errorIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },
  errorIcon: {
    fontSize: 22,
    fontWeight: "800",
    color: "#EF4444",
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: TEXT_PRIMARY,
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  errorBody: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
    letterSpacing: 0.1,
  },
  primaryBtn: {
    backgroundColor: ACCENT,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 40,
    width: "100%",
    alignItems: "center",
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  ghostBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 40,
    width: "100%",
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: BORDER,
  },
  ghostBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: TEXT_SECONDARY,
    letterSpacing: -0.2,
  },
});
