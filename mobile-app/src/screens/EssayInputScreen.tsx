import React, { useState, useCallback } from "react"
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Alert
} from "react-native"
import { useRouter, useLocalSearchParams } from "expo-router"
import { Colors, Spacing, Typography, Radius, Shadow } from "@/constants/theme"
import { LoadingOverlay } from "../components/LoadingOverlay"
import { essayApi, getErrorMessage } from "../services/api"
import { EssayTaskType } from "../types"

const WORD_TARGET: Record<EssayTaskType, number> = { task2: 250, task1: 150 }

const SAMPLE_PROMPTS: Record<EssayTaskType, string> = {
  task2: "Some people think that universities should provide students with more practical training for future jobs. Others believe that the primary purpose of a university is to give access to knowledge for its own sake. Discuss both views and give your own opinion.",
  task1: "The graph below shows the percentage of people in different age groups who used the internet daily in a European country between 2005 and 2020. Summarize the information by selecting and reporting the main features, and make comparisons where relevant.",
}

export default function EssayInputScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ taskType?: string }>()

  const [taskType, setTaskType] = useState<EssayTaskType>(
    (params.taskType as EssayTaskType) ?? "task2"
  )
  const [prompt, setPrompt] = useState(SAMPLE_PROMPTS[taskType])
  const [essayText, setEssayText] = useState("")
  const [loading, setLoading] = useState(false)

  const wordCount = essayText.trim() ? essayText.trim().split(/\s+/).filter(Boolean).length : 0
  const target = WORD_TARGET[taskType]
  const wordPct = Math.min(1, wordCount / target)
  const isReady = wordCount >= 50 && prompt.trim().length > 0

  const switchTask = useCallback((t: EssayTaskType) => {
    setTaskType(t)
    setPrompt(SAMPLE_PROMPTS[t])
  }, [])

  const handleSubmit = async () => {
    if (!isReady) return

    setLoading(true)
    try {
      const result = await essayApi.score({ essayText, prompt, taskType })
      router.replace({ pathname: "/essay/result", params: { essayId: result.essayId, score: String(result.score) } })
    } catch (err) {
      Alert.alert("Scoring Failed", getErrorMessage(err), [{ text: "OK" }])
    } finally {
      setLoading(false)
    }
  }

  const wordBarColor = wordCount < target * 0.6
    ? Colors.error
    : wordCount < target
    ? Colors.warning
    : Colors.success

  return (
    <View style={styles.container}>
      <LoadingOverlay visible={loading} message="Scoring your essay" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Write Essay</Text>
        <View style={{ width: 60 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* Task type toggle */}
          <View style={styles.toggleRow}>
            {(["task2", "task1"] as EssayTaskType[]).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.toggleBtn, taskType === t && styles.toggleActive]}
                onPress={() => switchTask(t)}
              >
                <Text style={[styles.toggleText, taskType === t && styles.toggleTextActive]}>
                  {t === "task2" ? "Task 2 — Essay" : "Task 1 — Data"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Prompt */}
          <Text style={styles.sectionLabel}>ESSAY PROMPT</Text>
          <TextInput
            style={styles.promptInput}
            value={prompt}
            onChangeText={setPrompt}
            multiline
            placeholder="Enter or paste the essay prompt here..."
            placeholderTextColor={Colors.textMuted}
            textAlignVertical="top"
          />

          {/* Essay */}
          <View style={styles.essayHeader}>
            <Text style={styles.sectionLabel}>YOUR ESSAY</Text>
            <View style={styles.wordBadge}>
              <Text style={[styles.wordCount, { color: wordBarColor }]}>
                {wordCount} / {target} words
              </Text>
            </View>
          </View>

          {/* Word count bar */}
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${wordPct * 100}%` as any, backgroundColor: wordBarColor }]} />
          </View>

          <TextInput
            style={[styles.essayInput, { minHeight: 280 }]}
            value={essayText}
            onChangeText={setEssayText}
            multiline
            placeholder={`Start writing your ${taskType === "task2" ? "academic essay" : "graph description"} here...\n\nMinimum 50 words to submit, ${target}+ words recommended.`}
            placeholderTextColor={Colors.textMuted}
            textAlignVertical="top"
            autoCapitalize="sentences"
            autoCorrect
          />

          {/* Tips row */}
          <View style={styles.tipsRow}>
            <Text style={styles.tipChip}>🎯 {target}+ words recommended</Text>
            <Text style={styles.tipChip}>✏️ Check spelling</Text>
          </View>
        </ScrollView>

        {/* Submit */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitBtn, !isReady && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={!isReady || loading}
            activeOpacity={0.85}
          >
            <Text style={styles.submitText}>
              {loading ? "Scoring..." : "Score My Essay"}
            </Text>
          </TouchableOpacity>
          {!isReady && wordCount < 50 && (
            <Text style={styles.hint}>Write at least 50 words to submit</Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: Colors.background },
  header:          { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: Colors.surface, paddingTop: 52, paddingBottom: 12, paddingHorizontal: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn:         { paddingVertical: 4, paddingRight: 12 },
  backText:        { ...Typography.body, color: Colors.primary, fontWeight: "600" },
  headerTitle:     { ...Typography.heading3 },
  scroll:          { flex: 1 },
  content:         { padding: Spacing.lg, paddingBottom: 20 },
  toggleRow:       { flexDirection: "row", backgroundColor: Colors.surfaceAlt, borderRadius: Radius.md, padding: 3, marginBottom: Spacing.xl },
  toggleBtn:       { flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.sm, alignItems: "center" },
  toggleActive:    { backgroundColor: Colors.surface, ...Shadow.sm },
  toggleText:      { ...Typography.bodySmall, color: Colors.textSecondary, fontWeight: "600" },
  toggleTextActive:{ color: Colors.primary },
  sectionLabel:    { ...Typography.caption, letterSpacing: 1, textTransform: "uppercase", marginBottom: Spacing.xs, fontWeight: "700" },
  promptInput:     { backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, ...Typography.bodySmall, lineHeight: 20, marginBottom: Spacing.lg, minHeight: 90 },
  essayHeader:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.xs },
  wordBadge:       { backgroundColor: Colors.surfaceAlt, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  wordCount:       { fontSize: 12, fontWeight: "700" },
  barBg:           { height: 5, backgroundColor: Colors.surfaceAlt, borderRadius: Radius.full, marginBottom: Spacing.sm, overflow: "hidden" },
  barFill:         { height: "100%", borderRadius: Radius.full },
  essayInput:      { backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, ...Typography.body, lineHeight: 24, marginBottom: Spacing.md },
  tipsRow:         { flexDirection: "row", gap: Spacing.sm, flexWrap: "wrap", marginBottom: Spacing.sm },
  tipChip:         { ...Typography.caption, backgroundColor: Colors.surfaceAlt, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 4 },
  footer:          { backgroundColor: Colors.surface, padding: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border },
  submitBtn:       { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: 16, alignItems: "center", ...Shadow.md },
  submitDisabled:  { backgroundColor: Colors.textMuted },
  submitText:      { fontSize: 16, fontWeight: "700", color: Colors.surface },
  hint:            { ...Typography.caption, textAlign: "center", marginTop: Spacing.xs, color: Colors.textMuted },
})
