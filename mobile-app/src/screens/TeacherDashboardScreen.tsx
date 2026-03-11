import React, { useState, useEffect, useCallback } from "react"
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert
} from "react-native"
import { useRouter } from "expo-router"
import { Colors, Spacing, Typography, Radius, Shadow } from "@/constants/theme"
import { getBandColor } from "@/utils/bandColor"
import { API_BASE_URL } from "../config/api"

// ── Types ─────────────────────────────────────────────────────────
interface CenterAnalytics {
  center:           { name: string; logoUrl?: string; studentCount: number }
  totalStudents:    number
  totalEssays:      number
  averageScore:     number
  pendingReviews:   number
  recentActivity:   { date: string; count: number }[]
  scoreDistribution:{ band: string; count: number }[]
  topStudents:      { name: string; averageScore: number; essaysSubmitted: number }[]
}


// ── Stat Card ─────────────────────────────────────────────────────
function StatCard({ label, value, icon, accent }: {
  label: string; value: string | number; icon: string; accent?: string
}) {
  return (
    <View style={[styles.statCard, accent ? { borderLeftColor: accent, borderLeftWidth: 4 } : {}]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, accent ? { color: accent } : {}]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

export default function TeacherDashboardScreen() {
  const router = useRouter()
  const [analytics, setAnalytics] = useState<CenterAnalytics | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [refreshing,setRefreshing]= useState(false)
  // Stub token — replace with auth context
  const token = "YOUR_TEACHER_JWT_TOKEN"

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true)
    else setLoading(true)
    try {
      const res  = await fetch(`${API_BASE_URL}/teacher/center/analytics`, {
        headers: { Authorization: `Bearer ${token}`, "x-center-id": "dummy" },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? "Failed to load dashboard")
      setAnalytics(data.data)
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Network error")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
  }

  if (!analytics) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 48 }}>🏫</Text>
        <Text style={[Typography.heading3, { marginTop: Spacing.lg }]}>No center yet</Text>
        <Text style={[Typography.body, { color: Colors.textSecondary, textAlign: "center", marginTop: Spacing.sm }]}>
          Create a center to start managing students
        </Text>
        <TouchableOpacity style={styles.createBtn} onPress={() => router.push("/teacher/create-center" as any)}>
          <Text style={styles.createBtnText}>Create Center</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const scoreColor = getBandColor(analytics.averageScore)

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{analytics.center.name}</Text>
          <Text style={styles.headerSub}>Teacher Dashboard</Text>
        </View>
        <TouchableOpacity
          style={styles.studentsBtn}
          onPress={() => router.push("/teacher/students" as any)}
        >
          <Text style={styles.studentsBtnText}>Students →</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.primary} />}
      >
        {/* Pending reviews alert */}
        {analytics.pendingReviews > 0 && (
          <TouchableOpacity
            style={styles.alertBanner}
            onPress={() => router.push({ pathname: "/teacher/essays", params: { reviewed: "false" } })}
            activeOpacity={0.85}
          >
            <Text style={styles.alertIcon}>📬</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>{analytics.pendingReviews} essays awaiting review</Text>
              <Text style={styles.alertSub}>Tap to view unreviewed essays</Text>
            </View>
            <Text style={styles.alertArrow}>→</Text>
          </TouchableOpacity>
        )}

        {/* Key stats */}
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          <StatCard label="Students"      value={analytics.totalStudents} icon="👥" accent={Colors.primary} />
          <StatCard label="Essays Scored" value={analytics.totalEssays}   icon="📝" />
          <StatCard label="Avg Band"      value={analytics.averageScore.toFixed(1)} icon="🎯" accent={scoreColor} />
          <StatCard label="To Review"     value={analytics.pendingReviews} icon="⏳" accent={analytics.pendingReviews > 0 ? Colors.warning : Colors.success} />
        </View>

        {/* Recent activity */}
        {analytics.recentActivity.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Activity — Last 7 Days</Text>
            <View style={styles.activityCard}>
              {analytics.recentActivity.map((a) => {
                const maxCount = Math.max(...analytics.recentActivity.map((x) => x.count), 1)
                const pct = a.count / maxCount
                return (
                  <View key={a.date} style={styles.activityRow}>
                    <Text style={styles.activityDate}>{a.date.slice(5)}</Text>
                    <View style={styles.activityBarBg}>
                      <View style={[styles.activityBarFill, { width: `${pct * 100}%` as unknown as number }]} />
                    </View>
                    <Text style={styles.activityCount}>{a.count}</Text>
                  </View>
                )
              })}
            </View>
          </>
        )}

        {/* Score distribution */}
        {analytics.scoreDistribution.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Score Distribution</Text>
            <View style={styles.distCard}>
              {analytics.scoreDistribution.map((d) => (
                <View key={d.band} style={styles.distRow}>
                  <Text style={styles.distBand}>{d.band}</Text>
                  <Text style={[styles.distCount, { color: Colors.primary }]}>{d.count}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Top students */}
        {analytics.topStudents.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Top Students</Text>
            <View style={styles.topCard}>
              {analytics.topStudents.map((s, i) => (
                <View key={i} style={[styles.topRow, i < analytics.topStudents.length - 1 && styles.topBorder]}>
                  <View style={[styles.rankBadge, { backgroundColor: i === 0 ? "#FFD700" : i === 1 ? "#C0C0C0" : Colors.surfaceAlt }]}>
                    <Text style={styles.rankText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.topName} numberOfLines={1}>{s.name}</Text>
                  <View style={styles.topMeta}>
                    <Text style={[styles.topScore, { color: getBandColor(s.averageScore) }]}>
                      {s.averageScore.toFixed(1)}
                    </Text>
                    <Text style={styles.topEssays}>{s.essaysSubmitted} essays</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Quick actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          {[
            { label: "View All Essays",    icon: "📋", route: "/teacher/essays" },
            { label: "Unreviewed",         icon: "⏳", route: "/teacher/essays?reviewed=false" },
            { label: "All Students",       icon: "👥", route: "/teacher/students" },
          ].map((a) => (
            <TouchableOpacity
              key={a.label}
              style={styles.actionCard}
              onPress={() => router.push(a.route as never)}
              activeOpacity={0.8}
            >
              <Text style={styles.actionIcon}>{a.icon}</Text>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: Colors.background },
  center:         { flex: 1, justifyContent: "center", alignItems: "center", padding: Spacing.xl },
  header:         { backgroundColor: Colors.primary, paddingTop: 56, paddingBottom: 24, paddingHorizontal: Spacing.xl, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  headerTitle:    { ...Typography.heading2, color: Colors.surface, fontWeight: "800" },
  headerSub:      { ...Typography.bodySmall, color: "rgba(255,255,255,0.75)", marginTop: 2 },
  studentsBtn:    { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: Radius.md, paddingVertical: 8, paddingHorizontal: 14 },
  studentsBtnText:{ ...Typography.bodySmall, color: Colors.surface, fontWeight: "700" },
  content:        { padding: Spacing.lg },

  alertBanner:    { flexDirection: "row", alignItems: "center", backgroundColor: Colors.warningLight, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.warning + "50", gap: Spacing.md },
  alertIcon:      { fontSize: 24 },
  alertTitle:     { ...Typography.body, fontWeight: "700", color: Colors.text },
  alertSub:       { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  alertArrow:     { fontSize: 18, color: Colors.textMuted },

  sectionTitle:   { ...Typography.heading3, marginBottom: Spacing.md, marginTop: Spacing.xs },
  statsGrid:      { flexDirection: "row", flexWrap: "wrap", gap: Spacing.md, marginBottom: Spacing.xl },
  statCard:       { flex: 1, minWidth: "44%", backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, ...Shadow.sm, alignItems: "center" },
  statIcon:       { fontSize: 24, marginBottom: Spacing.xs },
  statValue:      { ...Typography.heading2, fontWeight: "800" },
  statLabel:      { ...Typography.caption, textAlign: "center", marginTop: 2 },

  activityCard:   { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.xl, ...Shadow.sm },
  activityRow:    { flexDirection: "row", alignItems: "center", marginBottom: Spacing.sm, gap: Spacing.md },
  activityDate:   { ...Typography.caption, width: 32, fontWeight: "600" },
  activityBarBg:  { flex: 1, height: 8, backgroundColor: Colors.surfaceAlt, borderRadius: Radius.full, overflow: "hidden" },
  activityBarFill:{ height: "100%", backgroundColor: Colors.primary, borderRadius: Radius.full } as never,
  activityCount:  { ...Typography.caption, width: 24, textAlign: "right", fontWeight: "600" },

  distCard:       { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.xl, ...Shadow.sm },
  distRow:        { flexDirection: "row", justifyContent: "space-between", paddingVertical: Spacing.xs, borderBottomWidth: 1, borderBottomColor: Colors.border },
  distBand:       { ...Typography.body, color: Colors.textSecondary },
  distCount:      { ...Typography.body, fontWeight: "700" },

  topCard:        { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.xl, ...Shadow.sm },
  topRow:         { flexDirection: "row", alignItems: "center", paddingVertical: Spacing.sm, gap: Spacing.md },
  topBorder:      { borderBottomWidth: 1, borderBottomColor: Colors.border },
  rankBadge:      { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  rankText:       { fontSize: 12, fontWeight: "800", color: Colors.text },
  topName:        { flex: 1, ...Typography.body, fontWeight: "600" },
  topMeta:        { alignItems: "flex-end" },
  topScore:       { fontSize: 17, fontWeight: "800" },
  topEssays:      { ...Typography.caption },

  actionsRow:     { flexDirection: "row", gap: Spacing.md },
  actionCard:     { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, alignItems: "center", ...Shadow.sm, borderWidth: 1, borderColor: Colors.border },
  actionIcon:     { fontSize: 22, marginBottom: Spacing.xs },
  actionLabel:    { ...Typography.caption, textAlign: "center", fontWeight: "600" },

  createBtn:      { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: 14, paddingHorizontal: 40, marginTop: Spacing.xl, ...Shadow.md },
  createBtnText:  { ...Typography.body, color: Colors.surface, fontWeight: "700" },
})

