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

export default function StudentAssignmentsScreen() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await studentApi.getAssignments();
      const data = res.data?.data?.assignments ?? res.data?.data ?? [];
      setAssignments(data);
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
        <Text style={styles.headerTitle}>Bài tập được giao</Text>
      </View>
      <FlatList
        data={assignments}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const dueSoon = new Date(item.dueDate) < new Date(Date.now() + 86400000);
          const status = item.mySubmission
            ? "Đã nộp"
            : new Date(item.dueDate) < new Date()
              ? "Hết hạn"
              : "Chưa nộp";
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/student/assignments/${item._id}`)}
            >
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.meta}>Giáo viên: {(item as any).teacherId?.name ?? ""}</Text>
              <Text style={[styles.meta, dueSoon && { color: Colors.error }]}>⏰ Hạn: {formatDate(item.dueDate)}</Text>
              <Text style={styles.meta}>Trạng thái: {status}</Text>
              {item.mySubmission?.overallScore != null && (
                <Text style={styles.meta}>Band: {item.mySubmission.overallScore?.toFixed(1)}</Text>
              )}
            </TouchableOpacity>
          );
        }}
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
    paddingBottom: 16,
    paddingHorizontal: Spacing.xl,
  },
  headerTitle: { ...Typography.heading2, color: Colors.surface, fontWeight: "800" },
  list: { padding: Spacing.lg },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  title: { ...Typography.body, fontWeight: "700" },
  meta: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 4 },
});

