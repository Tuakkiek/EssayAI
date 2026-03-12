import React, { useState } from "react"
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert
} from "react-native"
import { useRouter, useLocalSearchParams } from "expo-router"
import { Colors, Spacing, Typography, Radius, Shadow } from "@/constants/theme"
import api from "../services/api"

// ── Types ─────────────────────────────────────────────────────────
type Tool = "rewrite" | "vocabulary" | "grammar"

interface RewriteResult {
  rewrittenEssay: string
  changesExplained: { original: string; rewritten: string; reason: string; type: string }[]
  bandEstimate: number
  keyImprovements: string[]
}

interface VocabResult {
  suggestions: {
    original: string
    alternatives: { word: string; context: string; register: string }[]
    explanation: string
    bandImpact: string
  }[]
  overallFeedback: string
  vocabBandEstimate: number
}

interface GrammarResult {
  explanations: {
    errorPhrase: string; corrected: string; ruleName: string
    fullExplanation: string; examples: { wrong: string; right: string }[]
    tip: string
  }[]
  topPattern: string
  grammarBandNote: string
}

// ── API helpers ───────────────────────────────────────────────────
const callImprovement = async (tool: Tool, essayId: string): Promise<unknown> => {
  const res = await api.post(`/improvement/${tool}`, { essayId })
  const data = res.data
  if (!data.success && !data.data) throw new Error(data.message ?? "AI request failed")
  return data.data || data
}

// ── Tool Button ───────────────────────────────────────────────────
function ToolButton({ icon, label, desc, active, loading, onPress }: {
  icon: string; label: string; desc: string; active: boolean; loading: boolean; onPress: () => void
}) {
  return (
    <TouchableOpacity
      style={[styles.toolBtn, active && styles.toolBtnActive]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.8}
    >
      <Text style={{ fontSize: 26 }}>{icon}</Text>
      <View style={{ flex: 1, marginLeft: Spacing.md }}>
        <Text style={[styles.toolLabel, active && { color: Colors.surface }]}>{label}</Text>
        <Text style={[styles.toolDesc,  active && { color: "rgba(255,255,255,0.75)" }]}>{desc}</Text>
      </View>
      {loading && active && <ActivityIndicator size="small" color={Colors.surface} />}
      {!loading && <Text style={[styles.toolArrow, active && { color: Colors.surface }]}>›</Text>}
    </TouchableOpacity>
  )
}

// ── Rewrite result panel ──────────────────────────────────────────
function RewritePanel({ result }: { result: RewriteResult }) {
  const [showChanges, setShowChanges] = useState(false)
  const typeColors: Record<string, string> = {
    vocabulary: Colors.info, grammar: Colors.success, structure: Colors.primary,
    clarity: Colors.warning, argument: "#8B5CF6",
  }

  return (
    <View>
      {/* Key improvements */}
      <View style={styles.resultCard}>
        <View style={styles.resultHeader}>
          <Text style={styles.resultTitle}>✨ Key Improvements</Text>
          <View style={[styles.bandEstimate, { backgroundColor: Colors.successLight }]}>
            <Text style={[styles.bandEstimateText, { color: Colors.success }]}>
              Est. Band {result.bandEstimate}
            </Text>
          </View>
        </View>
        {result.keyImprovements?.map((imp, i) => (
          <View key={i} style={styles.bulletRow}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>{imp}</Text>
          </View>
        ))}
      </View>

      {/* Rewritten essay */}
      <View style={styles.resultCard}>
        <Text style={styles.resultTitle}>📄 Rewritten Essay</Text>
        <Text style={styles.essayText}>{result.rewrittenEssay}</Text>
      </View>

      {/* Changes explained */}
      {result.changesExplained?.length > 0 && (
        <View style={styles.resultCard}>
          <TouchableOpacity
            style={styles.expandRow}
            onPress={() => setShowChanges((v) => !v)}
          >
            <Text style={styles.resultTitle}>
              🔍 Changes Explained ({result.changesExplained.length})
            </Text>
            <Text style={styles.expandChevron}>{showChanges ? "▲" : "▼"}</Text>
          </TouchableOpacity>
          {showChanges && result.changesExplained.map((c, i) => (
            <View key={i} style={styles.changeItem}>
              <View style={styles.changeRow}>
                <View style={[styles.changeTag, { backgroundColor: (typeColors[c.type] ?? Colors.textMuted) + "20" }]}>
                  <Text style={[styles.changeTagText, { color: typeColors[c.type] ?? Colors.textMuted }]}>
                    {c.type}
                  </Text>
                </View>
              </View>
              <Text style={styles.changeOrig}>❌ {"\""}{c.original}{"\""}</Text>
              <Text style={styles.changeNew}>✅ {"\""}{c.rewritten}{"\""}</Text>
              <Text style={styles.changeReason}>{c.reason}</Text>
              {i < result.changesExplained.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

// ── Vocabulary result panel ───────────────────────────────────────
function VocabPanel({ result }: { result: VocabResult }) {
  return (
    <View>
      <View style={styles.resultCard}>
        <Text style={styles.resultTitle}>📊 Vocabulary Assessment</Text>
        <Text style={styles.bodyText}>{result.overallFeedback}</Text>
        <View style={[styles.bandEstimate, { backgroundColor: Colors.infoLight, marginTop: Spacing.sm }]}>
          <Text style={[styles.bandEstimateText, { color: Colors.info }]}>
            Current Lexical Resource: Band {result.vocabBandEstimate}
          </Text>
        </View>
      </View>

      {result.suggestions?.map((s, i) => (
        <View key={i} style={styles.resultCard}>
          <View style={styles.vocabHeader}>
            <Text style={styles.vocabOriginal}>{"\""}{s.original}{"\""}</Text>
            <Text style={styles.vocabArrow}>→ better options:</Text>
          </View>
          <View style={styles.altList}>
            {s.alternatives?.map((alt, j) => (
              <View key={j} style={styles.altRow}>
                <Text style={styles.altWord}>{alt.word}</Text>
                <Text style={[styles.altRegister, {
                  color: alt.register === "academic" ? Colors.primary : Colors.textSecondary
                }]}>{alt.register}</Text>
                <Text style={styles.altContext}>{alt.context}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.vocabExpl}>{s.explanation}</Text>
          <Text style={styles.bandImpact}>📈 {s.bandImpact}</Text>
        </View>
      ))}
    </View>
  )
}

// ── Grammar result panel ──────────────────────────────────────────
function GrammarPanel({ result }: { result: GrammarResult }) {
  return (
    <View>
      <View style={styles.resultCard}>
        <Text style={styles.resultTitle}>📋 Pattern Analysis</Text>
        <Text style={styles.bodyText}>Most common error type: <Text style={{ fontWeight: "700" }}>{result.topPattern}</Text></Text>
        <Text style={[styles.bodyText, { marginTop: Spacing.xs }]}>{result.grammarBandNote}</Text>
      </View>

      {result.explanations?.map((exp, i) => (
        <View key={i} style={styles.resultCard}>
          <View style={styles.ruleHeader}>
            <View style={styles.ruleBadge}>
              <Text style={styles.ruleBadgeText}>{exp.ruleName}</Text>
            </View>
          </View>
          <View style={styles.correctionRow}>
            <Text style={styles.errorText}>❌ {exp.errorPhrase}</Text>
            <Text style={styles.correctedText}>✅ {exp.corrected}</Text>
          </View>
          <Text style={styles.ruleExpl}>{exp.fullExplanation}</Text>
          {exp.examples?.length > 0 && (
            <View style={styles.examplesBox}>
              <Text style={styles.examplesTitle}>More examples:</Text>
              {exp.examples.map((ex, j) => (
                <View key={j}>
                  <Text style={styles.exWrong}>✗ {ex.wrong}</Text>
                  <Text style={styles.exRight}>✓ {ex.right}</Text>
                </View>
              ))}
            </View>
          )}
          <View style={styles.tipBox}>
            <Text style={styles.tipText}>💡 {exp.tip}</Text>
          </View>
        </View>
      ))}
    </View>
  )
}

// ── Main Screen ───────────────────────────────────────────────────
export default function ImprovementScreen() {
  const router = useRouter()
  const { essayId } = useLocalSearchParams<{ essayId: string }>()

  const [activeTool, setActiveTool]     = useState<Tool | null>(null)
  const [loadingTool, setLoadingTool]   = useState<Tool | null>(null)
  const [results,     setResults]       = useState<Partial<Record<Tool, unknown>>>({})

  const runTool = async (tool: Tool) => {
    if (results[tool]) { setActiveTool(tool); return }   // use cached result

    setLoadingTool(tool)
    setActiveTool(tool)
    try {
      const data = await callImprovement(tool, essayId)
      setResults((prev) => ({ ...prev, [tool]: data }))
    } catch (err) {
      Alert.alert("AI Error", err instanceof Error ? err.message : "Request failed")
      setActiveTool(null)
    } finally {
      setLoadingTool(null)
    }
  }

  const TOOLS = [
    { id: "rewrite"    as Tool, icon: "✍️", label: "Essay Rewrite",     desc: "See a band 7.5+ version with changes explained" },
    { id: "vocabulary" as Tool, icon: "📚", label: "Vocabulary Boost",  desc: "Replace weak words with academic alternatives" },
    { id: "grammar"    as Tool, icon: "🔍", label: "Grammar Deep-Dive", desc: "Understand every error with rules and examples" },
  ]

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Improvement Tools</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          Choose a tool to get targeted AI feedback on your essay. Each analysis takes ~20–40 seconds.
        </Text>

        {/* Tool selector */}
        {TOOLS.map((t) => (
          <ToolButton
            key={t.id}
            icon={t.icon}
            label={t.label}
            desc={t.desc}
            active={activeTool === t.id}
            loading={loadingTool === t.id}
            onPress={() => runTool(t.id)}
          />
        ))}

        {/* Loading state */}
        {loadingTool && (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>
              {loadingTool === "rewrite"    ? "Rewriting your essay to band 7.5+..."
                : loadingTool === "vocabulary" ? "Analysing vocabulary range..."
                : "Deep-diving into grammar rules..."}
            </Text>
            <Text style={styles.loadingHint}>This usually takes 20–40 seconds</Text>
          </View>
        )}

        {/* Results */}
        {activeTool && !loadingTool && Boolean(results[activeTool]) && (
          <View style={styles.resultSection}>
            <Text style={styles.resultSectionTitle}>
              {activeTool === "rewrite" ? "✍️ Rewrite Results"
                : activeTool === "vocabulary" ? "📚 Vocabulary Results"
                : "🔍 Grammar Results"}
            </Text>

            {activeTool === "rewrite"    && <RewritePanel    result={results.rewrite    as RewriteResult} />}
            {activeTool === "vocabulary" && <VocabPanel     result={results.vocabulary as VocabResult} />}
            {activeTool === "grammar"    && <GrammarPanel   result={results.grammar    as GrammarResult} />}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.background },
  header:       { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: Colors.surface, paddingTop: 52, paddingBottom: 12, paddingHorizontal: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn:      { paddingVertical: 4, paddingRight: 12 },
  backText:     { ...Typography.body, color: Colors.primary, fontWeight: "600" },
  headerTitle:  { ...Typography.heading3 },
  content:      { padding: Spacing.lg },
  intro:        { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.lg, lineHeight: 22 },

  toolBtn:      { flexDirection: "row", alignItems: "center", backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1.5, borderColor: Colors.border, ...Shadow.sm },
  toolBtnActive:{ backgroundColor: Colors.primary, borderColor: Colors.primary },
  toolLabel:    { ...Typography.body, fontWeight: "700", marginBottom: 2 },
  toolDesc:     { ...Typography.bodySmall, color: Colors.textSecondary },
  toolArrow:    { fontSize: 20, color: Colors.textMuted },

  loadingCard:  { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.xxxl, alignItems: "center", marginTop: Spacing.lg, ...Shadow.md },
  loadingText:  { ...Typography.body, textAlign: "center", marginTop: Spacing.lg, color: Colors.textSecondary },
  loadingHint:  { ...Typography.caption, marginTop: Spacing.sm, color: Colors.textMuted },

  resultSection:      { marginTop: Spacing.lg },
  resultSectionTitle: { ...Typography.heading2, marginBottom: Spacing.md },
  resultCard:   { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.xl, marginBottom: Spacing.md, ...Shadow.sm },
  resultHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.md },
  resultTitle:  { ...Typography.heading3 },
  bandEstimate: { borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 4 },
  bandEstimateText: { ...Typography.caption, fontWeight: "700" },

  bulletRow:  { flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.xs },
  bullet:     { color: Colors.primary, fontWeight: "700", marginTop: 2 },
  bulletText: { ...Typography.body, flex: 1, lineHeight: 22 },
  essayText:  { ...Typography.body, lineHeight: 26, color: Colors.textSecondary },
  bodyText:   { ...Typography.body, lineHeight: 22, color: Colors.textSecondary },

  expandRow:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.md },
  expandChevron:{ color: Colors.textMuted, fontSize: 12 },
  changeItem:   { marginBottom: Spacing.xs },
  changeRow:    { flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.xs },
  changeTag:    { borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  changeTagText:{ ...Typography.caption, fontWeight: "700", textTransform: "uppercase" },
  changeOrig:   { ...Typography.bodySmall, color: Colors.error,   marginBottom: 3 },
  changeNew:    { ...Typography.bodySmall, color: Colors.success,  marginBottom: 3 },
  changeReason: { ...Typography.bodySmall, color: Colors.textSecondary, lineHeight: 18 },
  divider:      { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md },

  vocabHeader:  { marginBottom: Spacing.sm },
  vocabOriginal:{ ...Typography.heading3, color: Colors.error },
  vocabArrow:   { ...Typography.bodySmall, color: Colors.textMuted, marginTop: 2 },
  altList:      { gap: Spacing.sm, marginBottom: Spacing.md },
  altRow:       { backgroundColor: Colors.surfaceAlt, borderRadius: Radius.md, padding: Spacing.md },
  altWord:      { ...Typography.body, fontWeight: "700", color: Colors.primary },
  altRegister:  { ...Typography.caption, fontWeight: "600", textTransform: "uppercase", marginBottom: 3 },
  altContext:   { ...Typography.bodySmall, color: Colors.textSecondary, lineHeight: 18 },
  vocabExpl:    { ...Typography.bodySmall, color: Colors.textSecondary, lineHeight: 18, marginBottom: Spacing.sm },
  bandImpact:   { ...Typography.bodySmall, color: Colors.success, fontWeight: "600" },

  ruleHeader:   { marginBottom: Spacing.sm },
  ruleBadge:    { backgroundColor: Colors.primaryLight, borderRadius: Radius.full, alignSelf: "flex-start", paddingHorizontal: Spacing.md, paddingVertical: 3 },
  ruleBadgeText:{ ...Typography.caption, color: Colors.primary, fontWeight: "700" },
  correctionRow:{ backgroundColor: Colors.surfaceAlt, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md, gap: Spacing.xs },
  errorText:    { ...Typography.bodySmall, color: Colors.error },
  correctedText:{ ...Typography.bodySmall, color: Colors.success, fontWeight: "600" },
  ruleExpl:     { ...Typography.body, lineHeight: 22, color: Colors.textSecondary, marginBottom: Spacing.md },
  examplesBox:  { backgroundColor: Colors.surfaceAlt, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md, gap: Spacing.xs },
  examplesTitle:{ ...Typography.caption, fontWeight: "700", marginBottom: Spacing.xs },
  exWrong:      { ...Typography.bodySmall, color: Colors.error },
  exRight:      { ...Typography.bodySmall, color: Colors.success, fontWeight: "600" },
  tipBox:       { backgroundColor: Colors.warningLight, borderRadius: Radius.md, padding: Spacing.md },
  tipText:      { ...Typography.bodySmall, color: Colors.warning, fontWeight: "600", lineHeight: 18 },
})


