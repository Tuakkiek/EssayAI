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
import { essayApi, getErrorMessage, extractEssay, submissionApi } from "../services/api";
import { Essay } from "../types";
import { useBack } from "../hooks/useBack";
import { useAuth } from "../context/AuthContext";

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 40; // Tối đa khoảng 2 phút

export default function ResultScreen() {
  const router = useRouter();
  const goBack = useBack("/");
  const { essayId } = useLocalSearchParams<{
    essayId: string;
    score: string;
  }>();

  const { user } = useAuth();
  const [essay, setEssay] = useState<Essay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchEssay = useCallback(
    async (attempt = 0) => {
      try {
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
              "Quá trình chấm điểm đang mất nhiều thời gian hơn dự kiến. Vui lòng kiểm tra lại trong mục Lịch sử sau ít phút.",
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
          setIsPolling(false);
          setLoading(false);
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
            "Hệ thống đang bận. Vui lòng kiểm tra kết quả trong mục Lịch sử sau.",
          );
        }
      } catch (err) {
        setError(getErrorMessage(err));
        setLoading(false);
        setIsPolling(false);
      }
    },
    [essayId, user?.role],
  );

  useEffect(() => {
    fetchEssay(0);
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [fetchEssay]);

  const handleShare = async () => {
    const finalScore = essay?.score ?? essay?.overallScore ?? essay?.overallBand;
    if (!finalScore) return;
    await Share.share({
      message: `Tôi vừa đạt được ${finalScore.toFixed(1)} điểm cho bài viết IELTS của mình nhờ Essay AI! 🎯`,
    });
  };

  // ─── Trạng thái đang chấm điểm ──────────────────────────────────────────
  if (loading || isPolling) {
    const dots = ".".repeat((pollCount % 3) + 1);
    const elapsed = Math.round((pollCount * POLL_INTERVAL_MS) / 1000);
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 52, marginBottom: Spacing.xl }}>🤖</Text>
        <ActivityIndicator
          size="large"
          color={Colors.primary}
          style={{ marginBottom: Spacing.lg }}
        />
        <Text style={[Typography.heading3, { textAlign: "center" }]}>
          Đang chấm bài viết của bạn{dots}
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
          Giám khảo AI đang phân tích bài viết.{"\n"}Quá trình này thường mất từ 15–40 giây.
        </Text>
        {elapsed > 10 && (
          <Text
            style={[
              Typography.caption,
              { color: Colors.textMuted, marginTop: Spacing.md },
            ]}
          >
            Đã trôi qua {elapsed} giây...
          </Text>
        )}
      </View>
    );
  }

  // ─── Trạng thái lỗi ───────────────────────────────────────────────────
  if (error || !essay) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 48, marginBottom: Spacing.lg }}>😟</Text>
        <Text style={Typography.heading3}>Đã có lỗi xảy ra</Text>
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
          {error ?? "Không thể tải kết quả bài viết"}
        </Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => router.push("/history" as any)}
        >
          <Text style={styles.retryText}>Xem Lịch sử</Text>
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

  // ─── Lỗi từ AI Grader ────────────────────────────────────────────────
  if (essay.status === "error") {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 48, marginBottom: Spacing.lg }}>⚠️</Text>
        <Text style={Typography.heading3}>Chấm điểm thất bại</Text>
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
            "Giám khảo AI gặp sự cố kỹ thuật. Vui lòng thử gửi lại bài viết của bạn."}
        </Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => router.navigate("/essay/input" as any)}
        >
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.retryBtn,
            { backgroundColor: Colors.surfaceAlt, marginTop: Spacing.sm },
          ]}
          onPress={() => router.push("/history" as any)}
        >
          <Text style={[styles.retryText, { color: Colors.primary }]}>
            Xem Lịch sử
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

  // ─── Hiển thị kết quả ─────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <View style={[styles.header, { borderBottomColor: Colors.border }]}>
        <TouchableOpacity
          onPress={() => router.push("/")}
          style={styles.doneBtn}
        >
          <Text style={styles.doneBtnText}>← Trang chủ</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kết quả</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
          <Text style={styles.shareText}>Chia sẻ</Text>
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
          <Text style={styles.heroLabel}>Điểm IELTS Ước Tính</Text>
          {finalScore != null ? (
            <ScoreBadge score={finalScore} size="lg" />
          ) : (
            <Text style={[Typography.body, { color: Colors.textMuted }]}>
              Không có dữ liệu điểm
            </Text>
          )}
          <View style={styles.metaRow}>
            <Text style={styles.metaChip}>📝 {essay.wordCount} từ</Text>
            <Text style={styles.metaChip}>
              {essay.taskType === "task2"
                ? "Bài viết Task 2"
                : "Bài viết Task 1"}
            </Text>
            {essay.processingTimeMs && (
              <Text style={styles.metaChip}>
                ⏱️ {(essay.processingTimeMs / 1000).toFixed(1)} giây
              </Text>
            )}
          </View>
        </View>

        {(essay.aiFeedback || essay.feedback) && (
          <View style={styles.feedbackCard}>
            <Text style={styles.feedbackTitle}>📋 Nhận xét từ Giám khảo</Text>
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
            <Text style={styles.improveBtnText}>🚀 Công cụ cải thiện bài viết AI</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.tryAgainBtn}
          onPress={() => router.push("/essay/input")}
          activeOpacity={0.85}
        >
          <Text style={styles.tryAgainText}>✍️ Viết bài mới</Text>
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