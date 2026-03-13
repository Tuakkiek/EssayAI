import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Colors, Spacing, Typography, Radius, Shadow } from "@/constants/theme";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { essayApi, getErrorMessage, extractEssay } from "../services/api";
import { EssayTaskType } from "../types";
import { BackButton } from "../components/BackButton";
import { useBack } from "../hooks/useBack";
import { useRoleGuard } from "../hooks/useRoleGuard";

const WORD_TARGET: Record<EssayTaskType, number> = { task2: 250, task1: 150 };

const SAMPLE_PROMPTS: Record<EssayTaskType, string> = {
  task2:
    "Some people think that universities should provide students with more practical training for future jobs. Others believe that the primary purpose of a university is to give access to knowledge for its own sake. Discuss both views and give your own opinion.",
  task1:
    "The graph below shows the percentage of people in different age groups who used the internet daily in a European country between 2005 and 2020. Summarize the information by selecting and reporting the main features, and make comparisons where relevant.",
};

export default function EssayInputScreen() {
  useRoleGuard(["center_student", "free_student"]);

  const router = useRouter();
  const goBack = useBack("/");
  const params = useLocalSearchParams<{ taskType?: string }>();

  const [taskType, setTaskType] = useState<EssayTaskType>(
    (params.taskType as EssayTaskType) ?? "task2",
  );
  const [prompt, setPrompt] = useState(SAMPLE_PROMPTS[taskType]);
  const [essayText, setEssayText] = useState("");
  const [loading, setLoading] = useState(false);

  const wordCount = essayText.trim()
    ? essayText.trim().split(/\s+/).filter(Boolean).length
    : 0;
  const target = WORD_TARGET[taskType];
  const wordPct = Math.min(1, wordCount / target);
  const isReady = wordCount >= 50 && prompt.trim().length > 0;

  const switchTask = useCallback((t: EssayTaskType) => {
    setTaskType(t);
    setPrompt(SAMPLE_PROMPTS[t]);
  }, []);

  const handleSubmit = async () => {
    if (!isReady) return;
    setLoading(true);
    try {
      const res = await essayApi.submit(essayText, taskType);
      const essay = extractEssay(res.data);
      const essayId = essay?._id;
      if (!essayId) {
        Alert.alert(
          "Lỗi",
          "Server không trả về essay ID. Vui lòng thử lại.",
        );
        return;
      }
      router.navigate({ pathname: "/essay/result", params: { essayId } });
    } catch (err) {
      Alert.alert(
        "Chấm bài thất bại",
        getErrorMessage(err),
        [{ text: "OK" }],
      );
    } finally {
      setLoading(false);
    }
  };

  const wordBarColor = wordCount < target * 0.6 ? Colors.error : Colors.text;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <LoadingOverlay visible={loading} message="Đang chấm bài..." />

      <View style={styles.nav}>
        <BackButton label="Trang chủ" onPress={goBack} />
        <Text style={styles.navTitle}>Viết bài</Text>
        <View style={styles.navSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.segment}>
            {(["task2", "task1"] as EssayTaskType[]).map((t) => (
              <Pressable
                key={t}
                style={({ pressed }) => [
                  styles.segmentItem,
                  taskType === t && styles.segmentItemActive,
                  pressed && styles.segmentItemPressed,
                ]}
                onPress={() => switchTask(t)}
              >
                <Text
                  style={[
                    styles.segmentText,
                    taskType === t && styles.segmentTextActive,
                  ]}
                >
                  {t === "task2"
                    ? "Task 2 — Bài luận"
                    : "Task 1 — Dữ liệu"}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.sectionLabel}>Đề bài</Text>
          <TextInput
            style={styles.promptInput}
            value={prompt}
            onChangeText={setPrompt}
            multiline
            placeholder="Nhập hoặc dán đề bài ở đây..."
            placeholderTextColor={Colors.textMuted}
            textAlignVertical="top"
          />

          <View style={styles.essayHeader}>
            <Text style={styles.sectionLabel}>Bài viết</Text>
            <View style={styles.wordBadge}>
              <Text style={styles.wordCount}>
                {wordCount} / {target} từ
              </Text>
            </View>
          </View>

          <View style={styles.barBg}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${wordPct * 100}%` as any,
                  backgroundColor: wordBarColor,
                },
              ]}
            />
          </View>

          <TextInput
            style={styles.essayInput}
            value={essayText}
            onChangeText={setEssayText}
            multiline
            placeholder={`Bắt đầu viết ${
              taskType === "task2"
                ? "bài luận học thuật"
                : "mô tả biểu đồ"
            } ở đây...\n\nTối thiểu 50 từ để nộp, khuyến nghị ${
              target
            }+ từ.`}
            placeholderTextColor={Colors.textMuted}
            textAlignVertical="top"
            autoCapitalize="sentences"
            autoCorrect
          />

          <View style={styles.tipsRow}>
            <View style={styles.tipChip}>
              <Text style={styles.tipText}>
                Khuyến nghị {target}+ từ
              </Text>
            </View>
            <View style={styles.tipChip}>
              <Text style={styles.tipText}>Kiểm tra chính tả</Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [
              styles.submitBtn,
              !isReady && styles.submitDisabled,
              pressed && styles.submitPressed,
            ]}
            onPress={handleSubmit}
            disabled={!isReady || loading}
          >
            <Text style={styles.submitText}>
              {loading ? "Đang chấm..." : "Chấm bài"}
            </Text>
          </Pressable>
          {!isReady && wordCount < 50 && (
            <Text style={styles.hint}>
              Viết ít nhất 50 từ để nộp
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
  scroll: { flex: 1 },
  content: { padding: Spacing.md, paddingBottom: Spacing.sm },
  segment: {
    flexDirection: "row",
    backgroundColor: Colors.secondaryBackground,
    borderRadius: Radius.md,
    padding: 2,
    marginBottom: Spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.separator,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    alignItems: "center",
  },
  segmentItemActive: {
    backgroundColor: Colors.surfaceAlt,
    ...Shadow.sm,
  },
  segmentItemPressed: {
    opacity: 0.8,
  },
  segmentText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  segmentTextActive: { color: Colors.text },
  sectionLabel: {
    ...Typography.label,
    textTransform: "uppercase",
    marginBottom: Spacing.xs,
    fontWeight: "700",
  },
  promptInput: {
    backgroundColor: Colors.secondaryBackground,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.separator,
    padding: Spacing.md,
    ...Typography.body,
    marginBottom: Spacing.lg,
    minHeight: 100,
  },
  essayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  wordBadge: {
    backgroundColor: Colors.secondaryBackground,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.separator,
  },
  wordCount: { ...Typography.caption, color: Colors.textSecondary },
  barBg: {
    height: 4,
    backgroundColor: Colors.separator,
    borderRadius: Radius.full,
    marginBottom: Spacing.sm,
    overflow: "hidden",
  },
  barFill: { height: "100%" },
  essayInput: {
    backgroundColor: Colors.secondaryBackground,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.separator,
    padding: Spacing.md,
    ...Typography.body,
    marginBottom: Spacing.md,
    minHeight: 280,
  },
  tipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  tipChip: {
    backgroundColor: Colors.secondaryBackground,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.separator,
  },
  tipText: { ...Typography.caption, color: Colors.textSecondary },
  footer: {
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.separator,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: "center",
  },
  submitPressed: {
    opacity: 0.85,
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { ...Typography.body, color: Colors.onPrimary, fontWeight: "600" },
  hint: {
    ...Typography.caption,
    textAlign: "center",
    marginTop: Spacing.xs,
    color: Colors.textSecondary,
  },
});
