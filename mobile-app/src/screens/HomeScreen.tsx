import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Colors, Spacing, Typography, Radius, Shadow } from "@/constants/theme";
import { studentApi } from "../services/api";
import { Assignment } from "../types";
import { formatDate } from "@/utils/bandColor";
import { useAuth } from "../context/AuthContext";
import { useRoleGuard } from "../hooks/useRoleGuard";

export default function HomeScreen() {
  useRoleGuard(["center_student", "free_student"]);

  const router = useRouter();
  const { user, isLoading } = useAuth();
  const isStudent =
    user?.role === "center_student" || user?.role === "free_student";
  const [myClass, setMyClass] = useState<any>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [classRes, assignRes] = await Promise.all([
        studentApi.getMyClass().catch(() => ({ data: { data: null } })),
        studentApi.getAssignments(),
      ]);

      setMyClass(classRes.data?.data ?? null);
      const data =
        assignRes.data?.data?.assignments ?? assignRes.data?.data ?? [];
      setAssignments(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoading || !isStudent) return;
    loadData();
  }, [isLoading, isStudent, loadData]);

  const firstName = user?.name?.trim().split(" ")[0] || "Bạn";
  const isCenterStudent = user?.role === "center_student";

  if (isLoading || !isStudent) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const renderAssignment = ({ item }: { item: Assignment }) => {
    const dueSoon = new Date(item.dueDate) < new Date(Date.now() + 86400000);
    const isOverdue = new Date(item.dueDate) < new Date();
    const status = item.mySubmission
      ? "Đã nộp"
      : isOverdue
        ? "Hết hạn"
        : "Chưa nộp";
    const statusColor = item.mySubmission
      ? Colors.success
      : isOverdue
        ? Colors.error
        : Colors.textSecondary;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/student/assignments/${item._id}`)}
      >
        <Text style={styles.title}>{item.title}</Text>
        {item.className && (
          <Text style={styles.className}>Lớp: {item.className}</Text>
        )}
        {item.teacherId?.name && (
          <Text style={styles.meta}>Giáo viên: {item.teacherId.name}</Text>
        )}
        <Text style={[styles.meta, dueSoon && { color: Colors.error }]}>
          ⏰ Hạn: {formatDate(item.dueDate)}
        </Text>
        <Text style={[styles.status, { color: statusColor }]}>
          Trạng thái: {status}
        </Text>
        {item.mySubmission?.overallScore != null && (
          <Text style={styles.score}>
            ⭐ Band: {item.mySubmission.overallScore?.toFixed(1)}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const emptyComponent = (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>
        {isCenterStudent
          ? "Chưa có bài tập nào được giao"
          : "Chưa có đề thi hoặc bài tập từ admin"}
      </Text>
      {isCenterStudent && (
        <Text style={styles.emptySub}>Hỏi giáo viên hoặc kiểm tra sau</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Xin chào, {firstName}</Text>
        {isCenterStudent && myClass ? (
          <Text style={styles.headerSub}>
            Lớp {myClass.class?.name}{" "}
            {myClass.class.centerId?.name
              ? `- Trung tâm ${myClass.class.centerId.name}`
              : ""}
          </Text>
        ) : (
          <Text style={styles.headerSub}>Bài tập từ admin & đợt thi</Text>
        )}
      </View>

      <FlatList
        data={assignments}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        renderItem={renderAssignment}
        ListEmptyComponent={emptyComponent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 56,
    paddingBottom: 24,
    paddingHorizontal: Spacing.xl,
  },
  greeting: {
    ...Typography.heading2,
    color: Colors.surface,
    fontWeight: "800",
  },
  headerSub: {
    ...Typography.body,
    color: "rgba(255,255,255,0.9)",
    marginTop: 4,
  },
  list: { padding: Spacing.lg, paddingBottom: 40 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  title: { ...Typography.body, fontWeight: "700", marginBottom: 4 },
  className: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontWeight: "600",
    marginBottom: 8,
  },
  meta: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 2 },
  status: { ...Typography.bodySmall, marginTop: 4, fontWeight: "600" },
  score: {
    ...Typography.bodySmall,
    color: Colors.success,
    marginTop: 4,
    fontWeight: "700",
  },
  empty: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  emptyText: {
    ...Typography.body,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  emptySub: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    textAlign: "center",
  },
});
