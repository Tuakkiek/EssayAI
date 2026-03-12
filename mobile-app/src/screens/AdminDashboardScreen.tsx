import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Colors, Spacing, Typography, Radius, Shadow } from "@/constants/theme";
import { adminApi } from "../services/api";

export default function AdminDashboardScreen() {
  const router = useRouter();
  const [overview, setOverview] = useState<any | null>(null);
  const [userTrend, setUserTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [overviewRes, userRes] = await Promise.all([
        adminApi.getAnalyticsOverview(),
        adminApi.getAnalyticsUsers(),
      ]);
      setOverview(overviewRes.data?.data ?? null);
      setUserTrend(userRes.data?.data?.newUsers ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Stats</Text>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Users</Text>
            <Text style={styles.statValue}>{overview?.users?.total ?? 0}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Essays</Text>
            <Text style={styles.statValue}>{overview?.essays?.total ?? 0}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>AI Calls (mo)</Text>
            <Text style={styles.statValue}>0</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Revenue</Text>
            <Text style={styles.statValue}>{overview?.revenue?.totalVnd ?? 0}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/admin/users")}
          >
            <Text style={styles.actionLabel}>Quản lý users</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/admin/tasks")}
          >
            <Text style={styles.actionLabel}>Quản lý tasks</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Đăng ký 30 ngày</Text>
        <View style={styles.chartCard}>
          {userTrend.map((d) => (
            <View key={d._id} style={styles.chartRow}>
              <Text style={styles.chartLabel}>{d._id?.slice(5) ?? ""}</Text>
              <View style={styles.chartBarBg}>
                <View
                  style={[
                    styles.chartBarFill,
                    { width: `${Math.min(100, (d.count ?? 0) * 5)}%` as any },
                  ]}
                />
              </View>
              <Text style={styles.chartValue}>{d.count ?? 0}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: Spacing.xl,
  },
  headerTitle: { ...Typography.heading2, color: Colors.surface, fontWeight: "800" },
  content: { padding: Spacing.lg },
  sectionTitle: { ...Typography.heading3, marginBottom: Spacing.md },
  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.md },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  statLabel: { ...Typography.caption, color: Colors.textMuted },
  statValue: { ...Typography.heading3, marginTop: 4 },
  actionsRow: { flexDirection: "row", gap: Spacing.md, marginBottom: Spacing.lg },
  actionCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: "center",
    ...Shadow.sm,
  },
  actionLabel: { ...Typography.bodySmall, fontWeight: "700" },
  chartCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  chartRow: { flexDirection: "row", alignItems: "center", marginBottom: Spacing.xs },
  chartLabel: { width: 40, ...Typography.caption },
  chartBarBg: { flex: 1, height: 8, backgroundColor: Colors.surfaceAlt, borderRadius: Radius.full, overflow: "hidden" },
  chartBarFill: { height: "100%", backgroundColor: Colors.primary },
  chartValue: { width: 30, textAlign: "right", ...Typography.caption },
});

