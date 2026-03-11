import React, { useState, useEffect, useCallback } from "react"
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Dimensions
} from "react-native"
import { Colors, Spacing, Typography, Radius, Shadow } from "@/constants/theme"
import { getBandColor } from "@/utils/bandColor"
import { API_BASE_URL } from "../config/api"

const { width: SCREEN_W } = Dimensions.get("window")
const CHART_W = SCREEN_W - Spacing.lg * 2 - Spacing.xl * 2

// ── Types ─────────────────────────────────────────────────────────
interface ProgressData {
  timeline: { date: string; score: number; taskType: string; essayId: string }[]
  improvement: { firstScore: number; latestScore: number; delta: number; trend: string; streakDays: number }
  criteriaProgress: { criterion: string; first: number; latest: number; delta: number }[]
  weakestCriteria: string
  strongestCriteria: string
  totalEssays: number
  scoredEssays: number
  averageScore: number
  personalBest: number
}

const fetchProgress = async (): Promise<ProgressData> => {
  const { getToken } = await import("../services/authApi")
  const token = await getToken()
  const headers: Record<string, string> = {}
  if (token) headers["Authorization"] = `Bearer ${token}`

  return fetch(`${API_BASE_URL}/improvement/progress`, { headers })
    .then((r) => r.json())
    .then((d) => {
      if (!d.success) throw new Error(d.message)
      return d.data
    })
}

// ── Mini bar chart ────────────────────────────────────────────────
function ScoreChart({ timeline }: { timeline: ProgressData["timeline"] }) {
  if (timeline.length < 2) return null

  const scores  = timeline.map((t) => t.score)
  const minScore = Math.min(...scores) - 0.5
  const maxScore = Math.max(...scores) + 0.5
  const range    = maxScore - minScore || 1
  const barW     = Math.max(8, (CHART_W - (timeline.length - 1) * 4) / timeline.length)

  return (
    <View style={styles.chartWrap}>
      <Text style={styles.sectionTitle}>Score History</Text>
      {/* Y-axis labels */}
      <View style={styles.chartArea}>
        <View style={styles.yAxis}>
          {[9, 7, 5, 3].map((v) => (
            <Text key={v} style={styles.yLabel}>{v}</Text>
          ))}
        </View>
        <View style={styles.barsArea}>
          {timeline.map((t, i) => {
            const heightPct = ((t.score - minScore) / range) * 100
            const color     = getBandColor(t.score)
            return (
              <View key={i} style={[styles.barCol, { width: barW }]}>
                <Text style={[styles.barScore, { color }]}>{t.score}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { height: `${Math.max(10, heightPct)}%` as unknown as number, backgroundColor: color }]} />
                </View>
              </View>
            )
          })}
        </View>
      </View>
      {/* X-axis: show first/last date */}
      <View style={styles.xAxis}>
        <Text style={styles.xLabel}>{new Date(timeline[0].date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</Text>
        <Text style={styles.xLabel}>{timeline.length} essays</Text>
        <Text style={styles.xLabel}>{new Date(timeline[timeline.length - 1].date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</Text>
      </View>
    </View>
  )
}

// ── Trend badge ───────────────────────────────────────────────────
function TrendBadge({ trend, delta }: { trend: string; delta: number }) {
  const cfg = trend === "improving"
    ? { icon: "📈", color: Colors.success, bg: Colors.successLight, label: `+${delta} Improving` }
    : trend === "declining"
    ? { icon: "📉", color: Colors.error,   bg: Colors.errorLight,   label: `${delta} Declining` }
    : { icon: "➡️", color: Colors.warning, bg: Colors.warningLight, label: "Stable" }

  return (
    <View style={[styles.trendBadge, { backgroundColor: cfg.bg }]}>
      <Text style={{ fontSize: 16 }}>{cfg.icon}</Text>
      <Text style={[styles.trendLabel, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  )
}

// ── Main Screen ───────────────────────────────────────────────────
export default function ProgressScreen() {
  const [data,      setData]      = useState<ProgressData | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [refreshing,setRefreshing]= useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true)
    try {
      const d = await fetchProgress()
      setData(d)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load progress")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  )

  if (error) return (
    <View style={styles.center}>
      <Text style={{ fontSize: 40 }}>📡</Text>
      <Text style={[Typography.heading3, { marginTop: Spacing.md }]}>Couldn{"'"}t load</Text>
      <Text style={[Typography.body, { color: Colors.textSecondary, marginTop: Spacing.sm, textAlign: "center" }]}>{error}</Text>
      <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); load() }}>
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  )

  if (!data || data.scoredEssays === 0) return (
    <View style={styles.center}>
      <Text style={{ fontSize: 48 }}>🎯</Text>
      <Text style={[Typography.heading2, { marginTop: Spacing.lg, textAlign: "center" }]}>No progress yet</Text>
      <Text style={[Typography.body, { color: Colors.textSecondary, marginTop: Spacing.sm, textAlign: "center" }]}>
        Submit and score your first essay to start tracking progress
      </Text>
    </View>
  )

  const imp = data.improvement

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Progress</Text>
        <Text style={styles.headerSub}>{data.scoredEssays} essays tracked</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Overview stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: getBandColor(data.averageScore) }]}>{data.averageScore.toFixed(1)}</Text>
            <Text style={styles.statLbl}>Average</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: getBandColor(data.personalBest) }]}>{data.personalBest.toFixed(1)}</Text>
            <Text style={styles.statLbl}>Best Ever</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: Colors.primary }]}>{data.totalEssays}</Text>
            <Text style={styles.statLbl}>Total Essays</Text>
          </View>
          {imp.streakDays > 0 && (
            <View style={styles.statBox}>
              <Text style={[styles.statVal, { color: Colors.warning }]}>{imp.streakDays}🔥</Text>
              <Text style={styles.statLbl}>Day Streak</Text>
            </View>
          )}
        </View>

        {/* Trend */}
        <View style={styles.trendCard}>
          <View style={styles.trendRow}>
            <View>
              <Text style={styles.sectionTitle}>Overall Trend</Text>
              <Text style={Typography.bodySmall}>
                From {imp.firstScore.toFixed(1)} → {imp.latestScore.toFixed(1)}
              </Text>
            </View>
            <TrendBadge trend={imp.trend} delta={imp.delta} />
          </View>
        </View>

        {/* Chart */}
        {data.timeline.length > 1 && (
          <View style={styles.card}>
            <ScoreChart timeline={data.timeline} />
          </View>
        )}

        {/* Criteria progress */}
        {data.criteriaProgress.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Criteria Breakdown</Text>
            {data.criteriaProgress.map((c) => (
              <View key={c.criterion} style={styles.criteriaRow}>
                <View style={styles.criteriaInfo}>
                  <Text style={styles.criteriaName}>{c.criterion}</Text>
                  <Text style={styles.criteriaRange}>{c.first.toFixed(1)} → {c.latest.toFixed(1)}</Text>
                </View>
                <View style={styles.criteriaDelta}>
                  <Text style={[styles.deltaText, { color: c.delta >= 0 ? Colors.success : Colors.error }]}>
                    {c.delta >= 0 ? "+" : ""}{c.delta.toFixed(1)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Strengths & weaknesses */}
        {(data.weakestCriteria || data.strongestCriteria) && (
          <View style={styles.insightsRow}>
            {data.strongestCriteria ? (
              <View style={[styles.insightBox, { borderColor: Colors.success }]}>
                <Text style={styles.insightIcon}>💪</Text>
                <Text style={styles.insightLabel}>Strength</Text>
                <Text style={[styles.insightValue, { color: Colors.success }]}>{data.strongestCriteria}</Text>
              </View>
            ) : null}
            {data.weakestCriteria ? (
              <View style={[styles.insightBox, { borderColor: Colors.warning }]}>
                <Text style={styles.insightIcon}>🎯</Text>
                <Text style={styles.insightLabel}>Focus Area</Text>
                <Text style={[styles.insightValue, { color: Colors.warning }]}>{data.weakestCriteria}</Text>
              </View>
            ) : null}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.background },
  center:       { flex: 1, justifyContent: "center", alignItems: "center", padding: Spacing.xl },
  header:       { backgroundColor: Colors.primary, paddingTop: 56, paddingBottom: 20, paddingHorizontal: Spacing.xl },
  headerTitle:  { ...Typography.heading2, color: Colors.surface, fontWeight: "800" },
  headerSub:    { ...Typography.bodySmall, color: "rgba(255,255,255,0.8)", marginTop: 4 },
  content:      { padding: Spacing.lg },

  statsRow:  { flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.lg, flexWrap: "wrap" },
  statBox:   { flex: 1, minWidth: 70, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, alignItems: "center", ...Shadow.sm },
  statVal:   { fontSize: 22, fontWeight: "800", marginBottom: 2 },
  statLbl:   { ...Typography.caption, textAlign: "center" },

  trendCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.xl, marginBottom: Spacing.lg, ...Shadow.sm },
  trendRow:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  trendBadge:{ flexDirection: "row", alignItems: "center", gap: Spacing.xs, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  trendLabel:{ fontWeight: "700", fontSize: 13 },

  card:        { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.xl, marginBottom: Spacing.lg, ...Shadow.sm },
  sectionTitle:{ ...Typography.heading3, marginBottom: Spacing.md },

  chartWrap: {},
  chartArea: { flexDirection: "row", height: 140, marginBottom: Spacing.xs },
  yAxis:     { width: 28, justifyContent: "space-between", paddingVertical: 16 },
  yLabel:    { ...Typography.caption, textAlign: "right" },
  barsArea:  { flex: 1, flexDirection: "row", alignItems: "flex-end", gap: 4, paddingBottom: 16 },
  barCol:    { flex: 0, alignItems: "center", height: "100%" },
  barScore:  { ...Typography.caption, marginBottom: 2, fontWeight: "700" },
  barTrack:  { flex: 1, width: "100%", backgroundColor: Colors.surfaceAlt, borderRadius: 3, justifyContent: "flex-end" },
  barFill:   { borderRadius: 3, width: "100%" },
  xAxis:     { flexDirection: "row", justifyContent: "space-between" },
  xLabel:    { ...Typography.caption, color: Colors.textMuted },

  criteriaRow:   { flexDirection: "row", alignItems: "center", paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  criteriaInfo:  { flex: 1 },
  criteriaName:  { ...Typography.body, fontWeight: "600" },
  criteriaRange: { ...Typography.bodySmall },
  criteriaDelta: { width: 48, alignItems: "flex-end" },
  deltaText:     { fontSize: 15, fontWeight: "700" },

  insightsRow:   { flexDirection: "row", gap: Spacing.md, marginBottom: Spacing.lg },
  insightBox:    { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, alignItems: "center", borderWidth: 1.5, ...Shadow.sm },
  insightIcon:   { fontSize: 22, marginBottom: Spacing.xs },
  insightLabel:  { ...Typography.caption, marginBottom: 4 },
  insightValue:  { ...Typography.bodySmall, fontWeight: "700", textAlign: "center" },

  retryBtn:  { marginTop: Spacing.xl, backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingHorizontal: 32, paddingVertical: 12 },
  retryText: { ...Typography.body, color: Colors.surface, fontWeight: "700" },
})

