import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Colors, Spacing, Typography, Radius, Shadow } from "@/constants/theme";
import { assignmentApi, classApi, getErrorMessage } from "../services/api";
import { Assignment, ClassAnalytics, Class } from "../types";
import { useRoleGuard } from "../hooks/useRoleGuard";

const TABS = [
  { key: "students", label: "Học sinh" },
  { key: "assignments", label: "Bài tập" },
  { key: "analytics", label: "Thống kê" },
];

export default function TeacherClassDetailScreen() {
  useRoleGuard(["teacher", "admin"]);

  const router = useRouter();
  const { classId, backTo } = useLocalSearchParams<{
    classId: string;
    backTo?: string;
  }>();
  const [tab, setTab] = useState("students");
  const [cls, setCls] = useState<Class | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [analytics, setAnalytics] = useState<ClassAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!classId) return;
    setLoading(true);
    try {
      const [classRes, assignmentRes] = await Promise.all([
        classApi.getWithStudents(classId),
        assignmentApi.getAll({ classId }),
      ]);
      const classData = classRes.data?.data;
      setCls(classData?.class ?? classData?.cls ?? null);
      setStudents(classData?.students ?? []);
      const asg = assignmentRes.data?.data?.assignments ?? assignmentRes.data?.data ?? [];
      setAssignments(asg);
    } catch (err) {
      Alert.alert("Error", getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [classId]);

  const loadAnalytics = useCallback(async () => {
    if (!classId) return;
    try {
      const res = await classApi.getAnalytics(classId);
      setAnalytics(res.data?.data?.stats ?? null);
    } catch {
      setAnalytics(null);
    }
  }, [classId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (tab === "analytics") loadAnalytics();
  }, [tab, loadAnalytics]);

  const handleBack = useCallback(() => {
    const target = backTo === "classes" ? "/teacher/classes" : "/teacher/dashboard";
    router.replace(target);
  }, [backTo, router]);

  const handleRemoveStudent = async (studentId: string) => {
    if (!classId) return;
    try {
      await classApi.removeStudent(classId, studentId);
      load();
    } catch (err) {
      Alert.alert("Error", getErrorMessage(err));
    }
  };

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
        <TouchableOpacity onPress={handleBack}>
          <Text style={styles.backText}>Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{cls?.name ?? "Lớp học"}</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.tabRow}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabBtn, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === "students" && (
        <FlatList
          data={students}
          keyExtractor={(item, idx) => String(item._id ?? idx)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.studentRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name?.[0] ?? "S"}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.studentName}>{item.name}</Text>
                <Text style={styles.studentEmail}>{item.email ?? item.phone ?? ""}</Text>
              </View>
              <View style={styles.studentRight}>
                <Text style={styles.studentScore}>
                  {item.stats?.averageScore?.toFixed?.(1) ?? "-"}
                </Text>
                <TouchableOpacity onPress={() => handleRemoveStudent(item._id)}>
                  <Text style={styles.removeBtn}>Xóa</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListHeaderComponent={
            <TouchableOpacity
              style={styles.inviteBtn}
              onPress={() =>
                router.push({
                  pathname: "/teacher/classes/[classId]/create-students",
                  params: { classId },
                })
              }
            >
              <Text style={styles.inviteText}>Thêm học sinh</Text>
            </TouchableOpacity>
          }
        />
      )}

      {tab === "assignments" && (
        <FlatList
          data={assignments}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.assignmentCard}
              onPress={() => router.push(`/teacher/assignments/${item._id}`)}
            >
              <Text style={styles.assignmentTitle}>{item.title}</Text>
              <Text style={styles.assignmentMeta}>
                {item.status === "draft"
                  ? "Nháp"
                  : item.status === "published"
                    ? "Đang mở"
                    : "Đã đóng"}
              </Text>
              <Text style={styles.assignmentMeta}>
                📝 {item.submissionCount ?? (item as any).stats?.submissionCount ?? 0} bài nộp
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      {tab === "analytics" && (
        <View style={styles.analyticsWrap}>
          <Text style={styles.metric}>Điểm TB: {analytics?.averageScore?.toFixed?.(1) ?? 0}</Text>
          <Text style={styles.metric}>Tỷ lệ nộp bài: {analytics?.submissionRate ?? 0}%</Text>
          <Text style={styles.metric}>Tổng bài nộp: {analytics?.totalSubmissions ?? 0}</Text>

          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Phân phối điểm</Text>
            {analytics?.scoreDistribution?.map((d) => (
              <View key={d.band} style={styles.chartRow}>
                <Text style={styles.chartLabel}>{d.band}</Text>
                <View style={styles.chartBarBg}>
                  <View
                    style={[
                      styles.chartBarFill,
                      { width: `${Math.min(100, d.count * 10)}%` as any },
                    ]}
                  />
                </View>
                <Text style={styles.chartValue}>{d.count}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

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
  tabRow: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceAlt,
    margin: Spacing.lg,
    borderRadius: Radius.md,
    padding: 3,
  },
  tabBtn: { flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.sm, alignItems: "center" },
  tabActive: { backgroundColor: Colors.surface, ...Shadow.sm },
  tabText: { ...Typography.bodySmall, color: Colors.textSecondary, fontWeight: "600" },
  tabTextActive: { color: Colors.primary },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxxl },
  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  avatarText: { fontWeight: "700", color: Colors.primary },
  studentName: { ...Typography.body, fontWeight: "700" },
  studentEmail: { ...Typography.caption, color: Colors.textMuted },
  studentRight: { alignItems: "flex-end" },
  studentScore: { ...Typography.body, fontWeight: "700" },
  removeBtn: { ...Typography.caption, color: Colors.error, marginTop: 4 },
  inviteBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: Spacing.md,
    ...Shadow.md,
  },
  inviteText: { ...Typography.body, color: Colors.surface, fontWeight: "700" },
  assignmentCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  assignmentTitle: { ...Typography.body, fontWeight: "700" },
  assignmentMeta: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 4 },
  analyticsWrap: { padding: Spacing.lg },
  metric: { ...Typography.body, marginBottom: Spacing.sm },
  chartCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.md,
    ...Shadow.sm,
  },
  chartTitle: { ...Typography.body, fontWeight: "700", marginBottom: Spacing.sm },
  chartRow: { flexDirection: "row", alignItems: "center", marginBottom: Spacing.xs },
  chartLabel: { width: 40, ...Typography.caption },
  chartBarBg: { flex: 1, height: 8, backgroundColor: Colors.surfaceAlt, borderRadius: Radius.full, overflow: "hidden" },
  chartBarFill: { height: "100%", backgroundColor: Colors.primary },
  chartValue: { width: 30, textAlign: "right", ...Typography.caption },
});




