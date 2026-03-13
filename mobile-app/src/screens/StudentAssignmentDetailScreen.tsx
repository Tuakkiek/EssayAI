import React, { useCallback, useEffect, useState } from "react";
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
import { useLocalSearchParams } from "expo-router";
import { Colors, Spacing, Typography, Radius, Shadow } from "@/constants/theme";
import { studentApi, getErrorMessage } from "../services/api";
import { Assignment } from "../types";
import { useRoleGuard } from "../hooks/useRoleGuard";
import { BackButton } from "../components/BackButton";
import { useBack } from "../hooks/useBack";

export default function StudentAssignmentDetailScreen() {
  useRoleGuard(["center_student", "free_student"]);
  const goBack = useBack("/student/assignments");
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
      await studentApi.submitAssignment(assignment._id, text.trim());
      await load();
      setText("");
    } catch (err) {
      Alert.alert("Lỗi", getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (!assignment) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.tint} />
      </View>
    );
  }

  const hasSubmitted = !!assignment.mySubmission;

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

          <View style={styles.card}
          >
            <Text style={styles.sectionLabel}>Đề bài</Text>
            <Text style={styles.prompt}>{assignment.prompt}</Text>
          </View>

          {hasSubmitted ? (
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>Trạng thái</Text>
              <Text style={styles.submittedTitle}>Bạn đã nộp bài</Text>
              <Text style={styles.submittedMeta}>
                Trạng thái: {assignment.mySubmission?.status}
              </Text>
              {assignment.mySubmission?.overallScore != null && (
                <Text style={styles.submittedMeta}>
                  Band: {assignment.mySubmission?.overallScore?.toFixed(1)}
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
              <Text style={styles.submitText}>Nộp bài</Text>
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
