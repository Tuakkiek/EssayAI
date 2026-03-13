import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { Colors, Spacing, Typography, Radius, Shadow } from "@/constants/theme";
import { useAuth } from "../context/AuthContext";
import { studentApi } from "../services/api";
import { Assignment } from "../types";
import { formatDate } from "@/utils/bandColor";

const TASK_CARDS = [
  {
    type: "task2",
    title: "Task 2",
    subtitle: "Bài luận học thuật",
    description: "Trình bày quan điểm, thảo luận chủ đề hoặc đánh giá ý tưởng. 250+ từ.",
    icon: "✍️",
    color: Colors.primary,
    bg: Colors.primaryLight,
  },
  {
    type: "task1",
    title: "Task 1",
    subtitle: "Mô tả dữ liệu",
    description: "Mô tả biểu đồ, bản đồ, quy trình hoặc số liệu. 150+ từ.",
    icon: "📊",
    color: Colors.info,
    bg: Colors.infoLight,
  },
];

const TIPS = [
  { icon: "🎯", text: "Viết ít nhất 250 từ cho Task 2" },
  { icon: "🔗", text: "Dùng từ nối để tăng mạch lạc" },
  { icon: "📚", text: "Đa dạng từ vựng — tránh lặp" },
  { icon: "✅", text: "Luôn đọc lại để sửa lỗi ngữ pháp" },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  useEffect(() => {
    if (user?.role !== "center_student") return;
    studentApi
      .getAssignments()
      .then((res) => {
        const data = res.data?.data?.assignments ?? res.data?.data ?? [];
        setAssignments(data);
      })
      .catch(() => {
        setAssignments([]);
      });
  }, [user?.role]);

  const firstName = user?.name?.trim().split(" ")[0] || "Bạn";

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <View style={styles.header}>
        <Text style={styles.greeting}>Xin chào, {firstName}</Text>
        <Text style={styles.headerSub}>Sẵn sàng cải thiện điểm IELTS?</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.mainCta} onPress={() => router.push("/essay/input")} activeOpacity={0.85}>
          <View style={styles.ctaText}>
            <Text style={styles.ctaTitle}>Chấm bài ngay</Text>
            <Text style={styles.ctaSubtitle}>Nhận phản hồi AI trong dưới 1 phút</Text>
          </View>
          <Text style={styles.ctaArrow}>→</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Chọn dạng bài</Text>
        <View style={styles.taskRow}>
          {TASK_CARDS.map((card, idx) => (
            <TouchableOpacity
              key={card.type}
              style={[styles.taskCard, { borderColor: card.color }, idx === TASK_CARDS.length - 1 && styles.taskCardLast]}
              onPress={() =>
                router.push({
                  pathname: "/essay/input",
                  params: { taskType: card.type },
                })
              }
              activeOpacity={0.8}
            >
              <View style={[styles.taskIcon, { backgroundColor: card.bg }]}>
                <Text style={{ fontSize: 22 }}>{card.icon}</Text>
              </View>
              <Text style={[styles.taskTitle, { color: card.color }]}>{card.title}</Text>
              <Text style={styles.taskSubtitle}>{card.subtitle}</Text>
              <Text style={styles.taskDesc}>{card.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Mẹo nhanh</Text>
        <View style={styles.tipsCard}>
          {TIPS.map((tip, i) => (
            <View key={i} style={[styles.tipRow, i < TIPS.length - 1 && styles.tipBorder]}>
              <Text style={styles.tipIcon}>{tip.icon}</Text>
              <Text style={styles.tipText}>{tip.text}</Text>
            </View>
          ))}
        </View>

        {user?.role === "center_student" && (
          <>
            <Text style={styles.sectionTitle}>Bài tập được giao</Text>
            {assignments.length > 0 ? (
              assignments.slice(0, 3).map((a) => (
                <TouchableOpacity
                  key={a._id}
                  style={styles.assignmentCard}
                  onPress={() => router.push(`/student/assignments/${a._id}`)}
                >
                  <Text style={styles.assignmentTitle}>{a.title}</Text>
                  <Text
                    style={[
                      styles.assignmentDue,
                      new Date(a.dueDate) < new Date(Date.now() + 86400000) && { color: Colors.error },
                    ]}
                  >
                    ⏰ Hạn: {formatDate(a.dueDate)}
                  </Text>
                  {a.mySubmission ? (
                    <Text style={styles.assignmentSubmitted}>
                      ✅ Đã nộp · Band {a.mySubmission.score?.toFixed(1) ?? a.mySubmission.overallScore?.toFixed(1)}
                    </Text>
                  ) : (
                    <Text style={styles.assignmentPending}>⏳ Chưa nộp</Text>
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyText}>Chưa có bài tập nào</Text>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 56,
    paddingBottom: 28,
    paddingHorizontal: Spacing.xl,
  },
  greeting: { ...Typography.heading1, color: Colors.surface, fontWeight: "800" },
  headerSub: { ...Typography.body, color: "rgba(255,255,255,0.8)", marginTop: 4 },
  scroll: { flex: 1 },
  content: { padding: Spacing.xl, paddingBottom: 40 },
  mainCta: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    ...Shadow.md,
  },
  ctaText: { flex: 1 },
  ctaTitle: { fontSize: 17, fontWeight: "700", color: Colors.surface },
  ctaSubtitle: { ...Typography.bodySmall, color: "rgba(255,255,255,0.75)", marginTop: 2 },
  ctaArrow: { fontSize: 20, color: Colors.surface },
  sectionTitle: { ...Typography.heading3, marginBottom: Spacing.md, marginTop: Spacing.xs },
  taskRow: { flexDirection: "row", marginBottom: Spacing.xl },
  taskCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1.5,
    marginRight: Spacing.md,
    ...Shadow.sm,
  },
  taskCardLast: { marginRight: 0 },
  taskIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  taskTitle: { fontSize: 17, fontWeight: "700", marginBottom: 2 },
  taskSubtitle: { ...Typography.label, marginBottom: Spacing.xs },
  taskDesc: { ...Typography.bodySmall, lineHeight: 18 },
  tipsCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, ...Shadow.sm },
  tipRow: { flexDirection: "row", alignItems: "center", paddingVertical: Spacing.sm },
  tipBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  tipIcon: { fontSize: 18, marginRight: Spacing.md, width: 28 },
  tipText: { ...Typography.body, flex: 1 },
  assignmentCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md, ...Shadow.sm },
  assignmentTitle: { ...Typography.body, fontWeight: "700" },
  assignmentDue: { ...Typography.bodySmall, marginTop: 4 },
  assignmentSubmitted: { ...Typography.caption, color: Colors.success, marginTop: 4 },
  assignmentPending: { ...Typography.caption, color: Colors.textSecondary, marginTop: 4 },
  emptyText: { ...Typography.bodySmall, color: Colors.textMuted },
});
