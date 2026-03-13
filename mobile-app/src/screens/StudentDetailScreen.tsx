import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Colors, Spacing, Typography, Radius, Shadow } from "@/constants/theme";
import { getBandColor } from "@/utils/bandColor";
import { teacherApi } from "../services/api";
import { useRoleGuard } from "../hooks/useRoleGuard";
import { useBack } from "../hooks/useBack";



interface StudentDetailData {
  student: {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
    avatarUrl: string | null;
    stats: {
      essaysSubmitted: number;
      averageScore: number;
      lastActiveAt?: string;
    };
    subscription: { plan: string; isActive: boolean };
  };
  recentEssays: {
    _id: string;
    prompt: string;
    score: number | null;
    taskType: string;
    isReviewedByTeacher: boolean;
    createdAt: string;
  }[];
  scoreTimeline: { date: string; score: number }[];
  totalReviewed: number;
  pendingReviews: number;
}

export default function StudentDetailScreen() {
  useRoleGuard(["teacher", "admin"]);

  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const goBack = useBack("/teacher/students");
  const [data, setData] = useState<StudentDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await teacherApi.getStudentById(id);
      const body = res.data;
      if (!body.success) throw new Error(body.message || "Không thể tải thông tin học sinh");
      setData(body.data);
    } catch (err) {
      Alert.alert("Lỗi", err instanceof Error ? err.message : "Tải dữ liệu thất bại");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  if (!data)
    return (
      <View style={styles.center}>
        <Text>Không tìm thấy học sinh</Text>
      </View>
    );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={goBack}>
          <Text style={styles.backBtnText}>← Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{data.student.name}</Text>
        <Text style={styles.headerSub}>
          {data.student.email ?? data.student.phone ?? "—"}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.flexRow}>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>
              {data.student.stats.averageScore.toFixed(1)}
            </Text>
            <Text style={styles.statLabel}>Điểm TB</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>
              {data.student.stats.essaysSubmitted}
            </Text>
            <Text style={styles.statLabel}>Bài đã viết</Text>
          </View>
        </View>

        <View style={styles.flexRowStyle}>
          <View style={styles.statCardSmall}>
            <Text style={styles.statValSmall}>{data.pendingReviews}</Text>
            <Text style={styles.statLabel}>Chờ nhận xét</Text>
          </View>
          <View style={styles.statCardSmall}>
            <Text style={styles.statValSmall}>{data.totalReviewed}</Text>
            <Text style={styles.statLabel}>Đã nhận xét</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Bài gần đây</Text>

        {data.recentEssays.map((essay) => (
          <TouchableOpacity
            key={essay._id}
            style={styles.essayCard}
            onPress={() => router.push(`/teacher/essays/${essay._id}` as any)}
          >
            <View style={styles.essayTop}>
              <View
                style={[
                  styles.taskBadge,
                  essay.taskType === "task1" ? styles.task1Bg : styles.task2Bg,
                ]}
              >
                <Text style={styles.taskText}>
                  {essay.taskType === "task1" ? "Task 1" : "Task 2"}
                </Text>
              </View>
              {essay.score != null && (
                <Text
                  style={[
                    styles.scoreText,
                    { color: getBandColor(essay.score) },
                  ]}
                >
                  {essay.score.toFixed(1)}
                </Text>
              )}
            </View>
            <Text style={styles.prompt} numberOfLines={2}>
              {essay.prompt}
            </Text>

            <View style={styles.essayBottom}>
              <Text style={styles.date}>
                {new Date(essay.createdAt).toLocaleDateString()}
              </Text>
              <Text
                style={
                  essay.isReviewedByTeacher
                    ? styles.reviewedTag
                    : styles.unreviewedTag
                }
              >
                {essay.isReviewedByTeacher ? "✓ Đã nhận xét" : "⏳ Chờ"}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 56,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  backBtn: { marginBottom: Spacing.sm },
  backBtnText: { ...Typography.body, color: Colors.surface },
  headerTitle: { ...Typography.heading2, color: Colors.surface },
  headerSub: { ...Typography.bodySmall, color: "rgba(255,255,255,0.7)" },
  content: { padding: Spacing.lg },
  flexRow: { flexDirection: "row", gap: Spacing.md, marginBottom: Spacing.md },
  flexRowStyle: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    alignItems: "center",
    ...Shadow.sm,
  },
  statCardSmall: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    padding: Spacing.md,
    borderRadius: Radius.md,
    alignItems: "center",
  },
  statVal: { ...Typography.heading1, color: Colors.primary },
  statValSmall: { ...Typography.heading3, color: Colors.text },
  statLabel: { ...Typography.caption, marginTop: 4 },
  sectionTitle: { ...Typography.heading3, marginBottom: Spacing.md },
  essayCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  essayTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  taskBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  task1Bg: { backgroundColor: "#E3F2FD" },
  task2Bg: { backgroundColor: "#FCE4EC" },
  taskText: { fontSize: 10, fontWeight: "700", color: Colors.textSecondary },
  scoreText: { fontWeight: "800", fontSize: 16 },
  prompt: { ...Typography.bodySmall, flex: 1, marginBottom: Spacing.sm },
  essayBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  date: { ...Typography.caption, color: Colors.textMuted },
  unreviewedTag: {
    ...Typography.caption,
    color: Colors.warning,
    fontWeight: "700",
  },
  reviewedTag: {
    ...Typography.caption,
    color: Colors.success,
    fontWeight: "700",
  },
});





