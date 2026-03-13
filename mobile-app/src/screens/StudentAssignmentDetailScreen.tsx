import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import {
  Colors,
  Spacing,
  Typography,
  Radius,
  Shadow,
  Fonts,
} from "@/constants/theme";
import { studentApi, getErrorMessage } from "../services/api";
import { Assignment } from "../types";
import { useRoleGuard } from "../hooks/useRoleGuard";
import { BackButton } from "../components/BackButton";
import { useBack } from "../hooks/useBack";

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 40;

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  scored: { label: "Đã chấm", color: Colors.success },
  graded: { label: "Đã chấm", color: Colors.success },
  scoring: { label: "Đang chấm…", color: Colors.warning },
  pending: { label: "Đang chờ", color: Colors.textMuted },
  error: { label: "Lỗi", color: Colors.error },
};

const normalizeStatus = (status?: string) =>
  status === "grading" ? "scoring" : status;

const getDisplayScore = (submission?: Assignment["mySubmission"] | null) =>
  submission?.score ??
  submission?.overallScore ??
  submission?.overallBand ??
  null;

const COMPLETION_COLORS = {
  blue: "#0A84FF",
  green: "#34C759",
  teal: "#5AC8FA",
  indigo: "#5856D6",
};

export default function StudentAssignmentDetailScreen() {
  useRoleGuard(["center_student", "free_student"]);
  const router = useRouter();
  const goBack = useBack("/student/assignments");
  const { id } = useLocalSearchParams<{ id: string }>();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [optimisticSubmitted, setOptimisticSubmitted] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [focusTick, setFocusTick] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);
  const [completionScore, setCompletionScore] = useState<number | null>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollingRef = useRef(false);
  const notifyOnCompleteRef = useRef(false);
  const completionVisibleRef = useRef(false);
  const completionAnim = useRef(new Animated.Value(0)).current;

  const load = useCallback(async () => {
    if (!id) return null;
    try {
      const res = await studentApi.getAssignmentById(id);
      const next = res.data?.data?.assignment ?? null;
      setAssignment(next);
      if (next?.mySubmission) setOptimisticSubmitted(false);
      return next;
    } catch (err) {
      Alert.alert("Lỗi", getErrorMessage(err));
      return null;
    }
  }, [id]);

  const openCompletion = useCallback(
    (score: number) => {
      if (completionVisibleRef.current) return;
      completionVisibleRef.current = true;
      setCompletionScore(score);
      setShowCompletion(true);
      completionAnim.setValue(0);
      Animated.timing(completionAnim, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    },
    [completionAnim],
  );

  const closeCompletion = useCallback(() => {
    Animated.timing(completionAnim, {
      toValue: 0,
      duration: 180,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      completionVisibleRef.current = false;
      setShowCompletion(false);
    });
  }, [completionAnim]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearTimeout(pollRef.current);
      pollRef.current = null;
    }
    pollingRef.current = false;
    setIsPolling(false);
    setPollCount(0);
  }, []);

  const pollOnce = useCallback(
    async (attempt: number) => {
      const next = await load();
      if (!next) {
        stopPolling();
        notifyOnCompleteRef.current = false;
        return;
      }
      const submission = next?.mySubmission ?? null;
      const normalizedStatus = normalizeStatus(submission?.status);
      const displayScore = getDisplayScore(submission);
      const isFinal =
        displayScore != null ||
        normalizedStatus === "graded" ||
        normalizedStatus === "scored";
      const isError = normalizedStatus === "error";

      if (isFinal || isError) {
        stopPolling();
        if (notifyOnCompleteRef.current && displayScore != null) {
          notifyOnCompleteRef.current = false;
          openCompletion(displayScore);
        }
        notifyOnCompleteRef.current = false;
        return;
      }

      if (attempt >= MAX_POLL_ATTEMPTS) {
        stopPolling();
        notifyOnCompleteRef.current = false;
        return;
      }

      setPollCount(attempt + 1);
      pollRef.current = setTimeout(
        () => pollOnce(attempt + 1),
        POLL_INTERVAL_MS,
      );
    },
    [load, stopPolling, openCompletion],
  );

  const startPolling = useCallback(() => {
    if (pollingRef.current) return;
    pollingRef.current = true;
    notifyOnCompleteRef.current = true;
    setIsPolling(true);
    setPollCount(0);
    pollOnce(0);
  }, [pollOnce]);

  useFocusEffect(
    useCallback(() => {
      load();
      setFocusTick((value) => value + 1);
      return () => {
        stopPolling();
      };
    }, [load, stopPolling]),
  );

  const handleSubmit = async () => {
    if (!assignment || !text.trim()) return;
    setSubmitting(true);
    try {
      await studentApi.submitAssignment(assignment._id, text.trim());
      setOptimisticSubmitted(true);
      notifyOnCompleteRef.current = true;
      await load();
      setText("");
    } catch (err) {
      setOptimisticSubmitted(false);
      notifyOnCompleteRef.current = false;
      Alert.alert("Lỗi", getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const hasSubmitted = !!assignment?.mySubmission || optimisticSubmitted;
  const submission = assignment?.mySubmission;
  const normalizedStatus = normalizeStatus(
    submission?.status ?? (hasSubmitted ? "pending" : undefined),
  );
  const status =
    STATUS_LABELS[normalizedStatus ?? "pending"] ?? STATUS_LABELS.pending;
  const displayScore = getDisplayScore(submission);
  const isFinal =
    displayScore != null ||
    normalizedStatus === "graded" ||
    normalizedStatus === "scored";
  const isError = normalizedStatus === "error";
  const isGrading = hasSubmitted && !isFinal && !isError;
  const dots = isPolling ? ".".repeat((pollCount % 3) + 1) : "";
  const criteria = assignment?.gradingCriteria;
  const requiredVocabulary = (criteria?.requiredVocabulary ?? []).filter((v) =>
    (v.word ?? "").trim(),
  );
  const hasStructure = !!criteria?.structureRequirements?.trim();
  const hasVocab = requiredVocabulary.length > 0;
  const showCriteria = hasStructure || hasVocab;

  useEffect(() => {
    if (displayScore != null && notifyOnCompleteRef.current) {
      notifyOnCompleteRef.current = false;
      openCompletion(displayScore);
    }
  }, [displayScore, openCompletion]);

  useEffect(() => {
    if (isGrading) startPolling();
    else stopPolling();
  }, [focusTick, isGrading, startPolling, stopPolling]);

  if (!assignment) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.tint} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.nav}>
        <BackButton label="Bài tập" onPress={goBack} />
        <Text style={styles.navTitle}>Chi tiết bài tập</Text>
        <View style={styles.navSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>{assignment.title}</Text>

          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Đề bài</Text>
            <Text style={styles.prompt}>{assignment.prompt}</Text>
          </View>

          {showCriteria && (
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>Yêu cầu của giáo viên</Text>

              {hasStructure && (
                <View style={styles.criteriaBlock}>
                  <Text style={styles.criteriaTitle}>Cấu trúc bài</Text>
                  <Text style={styles.criteriaText}>
                    {criteria?.structureRequirements?.trim()}
                  </Text>
                </View>
              )}

              {hasVocab && (
                <View style={styles.criteriaBlock}>
                  <Text style={styles.criteriaTitle}>Từ vựng yêu cầu</Text>
                  <View style={styles.vocabList}>
                    {requiredVocabulary.map((v, i) => {
                      const importanceLabel =
                        v.importance === "recommended"
                          ? "Khuyến khích"
                          : "Bắt buộc";
                      const synonyms = (v.synonyms ?? []).filter(Boolean);
                      return (
                        <View key={`${v.word}-${i}`} style={styles.vocabItem}>
                          <View style={styles.vocabHeader}>
                            <Text style={styles.vocabWord}>{v.word}</Text>
                            <View style={styles.importanceChip}>
                              <Text
                                style={[
                                  styles.importanceText,
                                  v.importance === "required" &&
                                    styles.importanceTextRequired,
                                ]}
                              >
                                {importanceLabel}
                              </Text>
                            </View>
                          </View>
                          {synonyms.length > 0 && (
                            <Text style={styles.vocabSyn}>
                              Đồng nghĩa: {synonyms.join(", ")}
                            </Text>
                          )}
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          )}

          {hasSubmitted ? (
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>Trạng thái</Text>
              <Text style={styles.submittedTitle}>Bạn đã nộp bài</Text>
              <View style={styles.statusRow}>
                <View
                  style={[styles.statusDot, { backgroundColor: status.color }]}
                />
                <Text style={[styles.statusLabel, { color: status.color }]}>
                  {status.label}
                </Text>
                {isGrading && (
                  <ActivityIndicator size="small" color={status.color} />
                )}
              </View>
              {isGrading && (
                <Text style={styles.submittedMeta}>Đang chấm điểm{dots}</Text>
              )}
              {displayScore != null && (
                <Text style={styles.submittedMeta}>
                  Band: {displayScore.toFixed(1)}
                </Text>
              )}
              {displayScore != null && (
                <View style={styles.resultButtonContainer}>
                  <Pressable
                    style={styles.resultButton}
                    onPress={() => {
                      if (submission?._id) {
                        router.push({
                          pathname: "/essay/result",
                          params: { essayId: submission._id },
                        });
                      }
                    }}
                  >
                    <Text style={styles.resultButtonText}>
                      Xem chi tiết kết quả
                    </Text>
                  </Pressable>
                </View>
              )}
              {isError && (
                <Text style={styles.submittedMeta}>
                  Có lỗi khi chấm điểm. Vui lòng thử lại sau.
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>Bài viết của bạn</Text>
              <TextInput
                style={styles.input}
                multiline
                value={text}
                onChangeText={setText}
                placeholder="Nhập bài viết..."
                placeholderTextColor={Colors.textMuted}
                textAlignVertical="top"
              />
            </View>
          )}
        </ScrollView>

        {!hasSubmitted && (
          <View style={styles.footer}>
            <Pressable
              style={({ pressed }) => [
                styles.submitBtn,
                submitting && styles.submitDisabled,
                pressed && styles.submitPressed,
              ]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              <Text style={styles.submitText}>
                {submitting ? "Đang nộp..." : "Nộp bài"}
              </Text>
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>

      <Modal
        visible={showCompletion}
        transparent
        animationType="none"
        onRequestClose={closeCompletion}
      >
        <View style={styles.modalRoot}>
          <Animated.View
            style={[
              styles.modalBackdrop,
              {
                opacity: completionAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.45],
                }),
              },
            ]}
          />
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closeCompletion}
          />

          <Animated.View
            style={[
              styles.modalCard,
              {
                opacity: completionAnim,
                transform: [
                  {
                    translateY: completionAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [18, 0],
                    }),
                  },
                  {
                    scale: completionAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.94, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.modalGlow} />
            <View style={styles.modalGlowAlt} />

            <View style={styles.modalHeader}>
              <View style={styles.modalIcon}>
                <Text style={styles.modalIconText}>✓</Text>
              </View>
              <Text style={styles.modalTitle}>Đã chấm xong</Text>
            </View>
            <Text style={styles.modalSubtitle}>
              Bài viết của bạn đã được chấm điểm.
            </Text>

            <View style={styles.bandPill}>
              <Text style={styles.bandLabel}>Band</Text>
              <Text style={styles.bandValue}>
                {completionScore != null ? completionScore.toFixed(1) : "--"}
              </Text>
            </View>

            <Pressable style={styles.modalButton} onPress={closeCompletion}>
              <Text style={styles.modalButtonText}>OK</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.separator,
  },
  navTitle: { ...Typography.heading3 },
  navSpacer: { width: 80 },
  content: { padding: Spacing.md, paddingBottom: Spacing.xl },
  title: { ...Typography.heading2, marginBottom: Spacing.md },
  card: {
    backgroundColor: Colors.secondaryBackground,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.separator,
    ...Shadow.sm,
  },
  sectionLabel: {
    ...Typography.label,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  prompt: { ...Typography.body, color: Colors.textSecondary },
  input: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.separator,
    padding: Spacing.md,
    minHeight: 180,
    ...Typography.body,
  },
  criteriaBlock: { marginTop: Spacing.sm },
  criteriaTitle: {
    ...Typography.bodySmall,
    color: Colors.text,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  criteriaText: { ...Typography.body, color: Colors.textSecondary },
  vocabList: { gap: Spacing.sm },
  vocabItem: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.separator,
    padding: Spacing.sm,
  },
  vocabHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  vocabWord: { ...Typography.body, fontWeight: "700" },
  importanceChip: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.separator,
    backgroundColor: Colors.secondaryBackground,
  },
  importanceText: { ...Typography.caption, fontWeight: "700" },
  importanceTextRequired: { color: Colors.error },
  vocabSyn: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  submittedTitle: { ...Typography.body, fontWeight: "600" },
  submittedMeta: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: {
    ...Typography.caption,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  footer: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.separator,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitPressed: {
    opacity: 0.8,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: {
    ...Typography.body,
    color: Colors.onPrimary,
    fontWeight: "600",
  },

  modalRoot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000000",
  },
  modalCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 24,
    padding: Spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.separator,
    alignItems: "center",
    overflow: "hidden",
    ...Shadow.md,
  },
  modalGlow: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: COMPLETION_COLORS.teal,
    opacity: 0.16,
    top: -90,
    right: -70,
  },
  modalGlowAlt: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: COMPLETION_COLORS.green,
    opacity: 0.12,
    bottom: -70,
    left: -40,
  },
  modalHeader: {
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  modalIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(10, 132, 255, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(10, 132, 255, 0.2)",
  },
  modalIconText: {
    fontSize: 26,
    fontWeight: "700",
    color: COMPLETION_COLORS.blue,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.text,
    fontFamily: Fonts.rounded,
    textAlign: "center",
  },
  modalSubtitle: {
    ...Typography.bodySmall,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  bandPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: "rgba(88, 86, 214, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(88, 86, 214, 0.18)",
    marginBottom: Spacing.lg,
  },
  bandLabel: {
    ...Typography.caption,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: Colors.textSecondary,
  },
  bandValue: {
    fontSize: 20,
    fontWeight: "700",
    color: COMPLETION_COLORS.indigo,
  },
  modalButton: {
    alignSelf: "stretch",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    backgroundColor: COMPLETION_COLORS.blue,
  },
  modalButtonText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
