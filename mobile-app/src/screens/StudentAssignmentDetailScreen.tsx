import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Colors, Spacing, Typography, Radius, Shadow } from "@/constants/theme";
import { studentApi, getErrorMessage } from "../services/api";
import { Assignment } from "../types";

export default function StudentAssignmentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const res = await studentApi.getAssignmentById(id);
    setAssignment(res.data?.data?.assignment ?? null);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async () => {
    if (!assignment || !text.trim()) return;
    setSubmitting(true);
    try {
      await studentApi.submitAssignment(assignment._id, text.trim(), assignment.taskType);
      await load();
      setText("");
    } catch (err) {
      Alert.alert("Error", getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (!assignment) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const hasSubmitted = !!assignment.mySubmission;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết bài tập</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{assignment.title}</Text>
        <Text style={styles.meta}>Task: {assignment.taskType}</Text>
        <Text style={styles.prompt}>{assignment.prompt}</Text>

        {hasSubmitted ? (
          <View style={styles.submittedCard}>
            <Text style={styles.submittedTitle}>Bạn đã nộp bài</Text>
            <Text style={styles.submittedMeta}>Trạng thái: {assignment.mySubmission?.status}</Text>
            {assignment.mySubmission?.overallScore != null && (
              <Text style={styles.submittedMeta}>
                Band: {assignment.mySubmission?.overallScore?.toFixed(1)}
              </Text>
            )}
          </View>
        ) : (
          <>
            <Text style={styles.label}>Bài viết của bạn</Text>
            <TextInput
              style={styles.input}
              multiline
              value={text}
              onChangeText={setText}
              placeholder="Nhập bài viết..."
              placeholderTextColor={Colors.textMuted}
            />
            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.submitDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              <Text style={styles.submitText}>Nộp bài</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
    paddingTop: 52,
    paddingBottom: 12,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backText: { ...Typography.body, color: Colors.primary, fontWeight: "600" },
  headerTitle: { ...Typography.heading3 },
  content: { padding: Spacing.lg },
  title: { ...Typography.heading3, marginBottom: Spacing.sm },
  meta: { ...Typography.bodySmall, color: Colors.textSecondary, marginBottom: Spacing.sm },
  prompt: { ...Typography.body, marginBottom: Spacing.md },
  label: { ...Typography.label, marginBottom: Spacing.xs },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    minHeight: 160,
    ...Typography.body,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: Spacing.md,
    ...Shadow.md,
  },
  submitDisabled: { backgroundColor: Colors.textMuted },
  submitText: { ...Typography.body, color: Colors.surface, fontWeight: "700" },
  submittedCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  submittedTitle: { ...Typography.body, fontWeight: "700" },
  submittedMeta: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 4 },
});

