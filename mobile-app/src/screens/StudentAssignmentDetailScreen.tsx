import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import { Colors, Spacing, Typography, Radius, Shadow } from "@/constants/theme";
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
  submission?.score ?? submission?.overallScore ?? submission?.overallBand ?? null;

export default function StudentAssignmentDetailScreen() {
  useRoleGuard(["center_student", "free_student"]);
  const goBack = useBack("/student/assignments");
  const { id } = useLocalSearchParams<{ id: string }>();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [optimisticSubmitted, setOptimisticSubmitted] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [focusTick, setFocusTick] = useState(0);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollingRef = useRef(false);
  const notifyOnCompleteRef = useRef(false);

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
          Alert.alert("Đã chấm xong", `Band: ${displayScore.toFixed(1)}`);
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
    [load, stopPolling],
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
  const status = STATUS_LABELS[normalizedStatus ?? "pending"] ??
    STATUS_LABELS.pending;
  const displayScore = getDisplayScore(submission);
  const isFinal =
    displayScore != null ||
    normalizedStatus === "graded" ||
    normalizedStatus === "scored";
  const isError = normalizedStatus === "error";
  const isGrading = hasSubmitted && !isFinal && !isError;
  const dots = isPolling ? ".".repeat((pollCount % 3) + 1) : "";

  useEffect(() => {
    if (displayScore != null && notifyOnCompleteRef.current) {
      Alert.alert("Đã chấm xong", `Band: ${displayScore.toFixed(1)}`);
      notifyOnCompleteRef.current = false;
    }
  }, [displayScore]);

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
                <Text style={styles.submittedMeta}>
                  Đang chấm điểm{dots}
                </Text>
              )}
              {displayScore != null && (
                <Text style={styles.submittedMeta}>
                  Band: {displayScore.toFixed(1)}
                </Text>
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
  submitText: { ...Typography.body, color: Colors.onPrimary, fontWeight: "600" },
});

