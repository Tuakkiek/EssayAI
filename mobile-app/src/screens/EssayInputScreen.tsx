/**
 * EssayInputScreen — Write Essay Screen
 * Spec: Single primary action (Submit), large input, minimal controls,
 * no additional buttons. Character count visible.
 */
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { PenLine, ChevronLeft } from "lucide-react-native";
import { Colors, Radius, Shadow, Spacing, Typography } from "../constants/theme";
import { AppButton } from "../components/AppButton";
import { essayApi, getErrorMessage, extractEssay } from "../services/api";
import { EssayTaskType } from "../types";
import { useRoleGuard } from "../hooks/useRoleGuard";
import { useBack } from "../hooks/useBack";

const WORD_TARGET: Record<EssayTaskType, number> = { task2: 250, task1: 150 };

const TASK_CONFIG = {
  task2: {
    label: "Task 2 — Essay",
    hint: "Academic argument or discussion",
    minWords: 250,
  },
  task1: {
    label: "Task 1 — Description",
    hint: "Graph, chart, or diagram",
    minWords: 150,
  },
};

export default function EssayInputScreen() {
  useRoleGuard(["center_student", "free_student"]);

  const router = useRouter();
  const goBack = useBack("/");
  const params = useLocalSearchParams<{ taskType?: string }>();

  const [taskType, setTaskType] = useState<EssayTaskType>(
    (params.taskType as EssayTaskType) ?? "task2",
  );
  const [essayText, setEssayText] = useState("");
  const [loading, setLoading] = useState(false);

  const wordCount = essayText.trim()
    ? essayText.trim().split(/\s+/).filter(Boolean).length
    : 0;

  const target = WORD_TARGET[taskType];
  const progress = Math.min(1, wordCount / target);
  const isReady = wordCount >= 50;
  const isAtTarget = wordCount >= target;

  const cfg = TASK_CONFIG[taskType];

  const handleSubmit = async () => {
    if (!isReady) return;
    setLoading(true);
    try {
      const res = await essayApi.submit(essayText, taskType);
      const essay = extractEssay(res.data);
      const essayId = essay?._id;
      if (!essayId) {
        Alert.alert("Error", "Could not submit essay. Please try again.");
        return;
      }
      router.navigate({ pathname: "/essay/result", params: { essayId } });
    } catch (err) {
      Alert.alert("Submission failed", getErrorMessage(err), [{ text: "OK" }]);
    } finally {
      setLoading(false);
    }
  };

  // Progress bar color
  const barColor = isAtTarget
    ? Colors.primary
    : wordCount >= target * 0.6
      ? Colors.warning
      : Colors.errorSoft;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable
          onPress={goBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
        >
          <ChevronLeft size={24} color={Colors.text} strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>Write Essay</Text>
        {/* Spacer to balance */}
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Task type selector — minimal 2-pill ── */}
          <View style={styles.taskRow}>
            {(["task2", "task1"] as EssayTaskType[]).map((t) => (
              <Pressable
                key={t}
                onPress={() => setTaskType(t)}
                style={({ pressed }) => [
                  styles.taskPill,
                  taskType === t && styles.taskPillActive,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text
                  style={[
                    styles.taskPillText,
                    taskType === t && styles.taskPillTextActive,
                  ]}
                >
                  {TASK_CONFIG[t].label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* ── Task hint ── */}
          <Text style={styles.taskHint}>{cfg.hint}</Text>

          {/* ── Essay input — large, focused ── */}
          <View style={[styles.inputCard, Shadow.sm]}>
            <View style={styles.inputHeader}>
              <PenLine size={16} color={Colors.textMuted} strokeWidth={2} />
              <Text style={styles.inputLabel}>Your Essay</Text>
              <View style={styles.wordBadge}>
                <Text
                  style={[
                    styles.wordCount,
                    isAtTarget && { color: Colors.primary },
                  ]}
                >
                  {wordCount} / {target}
                </Text>
              </View>
            </View>

            {/* Progress bar */}
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progress * 100}%` as any,
                    backgroundColor: barColor,
                  },
                ]}
              />
            </View>

            {/* The actual textarea */}
            <TextInput
              style={styles.input}
              value={essayText}
              onChangeText={setEssayText}
              multiline
              placeholder={
                taskType === "task2"
                  ? "Start your essay here...\n\nIntroduce your argument, support with examples, and conclude clearly."
                  : "Describe the data here...\n\nHighlight key trends, make comparisons, and summarize the main features."
              }
              placeholderTextColor={Colors.textMuted}
              textAlignVertical="top"
              autoCapitalize="sentences"
              autoCorrect
            />
          </View>

          {/* ── Tip chips — minimal ── */}
          <View style={styles.tipsRow}>
            <View style={styles.tipChip}>
              <Text style={styles.tipText}>Min 50 words to submit</Text>
            </View>
            <View style={styles.tipChip}>
              <Text style={styles.tipText}>Target: {target}+ words</Text>
            </View>
          </View>

          <View style={{ height: Spacing.xxxl }} />
        </ScrollView>

        {/* ── Single Primary CTA — fixed at bottom ── */}
        <View style={styles.footer}>
          <AppButton
            label={loading ? "Submitting..." : "Submit for AI Grading"}
            onPress={handleSubmit}
            disabled={!isReady}
            loading={loading}
            size="lg"
          />
          {!isReady && (
            <Text style={styles.footerHint}>
              Write at least 50 words to submit
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    paddingTop: Spacing.xs,
    backgroundColor: Colors.background,
  },
  backBtn: { padding: Spacing.xs },
  headerTitle: {
    ...Typography.title3,
    color: Colors.text,
  },

  // Scroll
  scroll: { flex: 1 },
  content: {
    padding: Spacing.md,
  },

  // Task selector
  taskRow: {
    flexDirection: "row",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  taskPill: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  taskPillActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  taskPillText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: "700",
  },
  taskPillTextActive: { color: Colors.primaryDark },
  taskHint: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
    textAlign: "center",
  },

  // Input card
  inputCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  inputHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  inputLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontWeight: "700",
    flex: 1,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  wordBadge: {
    backgroundColor: Colors.background,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  wordCount: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: Radius.full,
  },
  input: {
    ...Typography.body,
    color: Colors.text,
    minHeight: 280,
    lineHeight: 26,
  },

  // Tips
  tipsRow: {
    flexDirection: "row",
    gap: Spacing.xs,
    flexWrap: "wrap",
  },
  tipChip: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tipText: {
    ...Typography.caption,
    color: Colors.textMuted,
  },

  // Footer
  footer: {
    backgroundColor: Colors.background,
    padding: Spacing.md,
    paddingBottom: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    gap: Spacing.xs,
  },
  footerHint: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: "center",
  },
});
