import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Colors, Spacing, Typography, Radius, Shadow } from "@/constants/theme";
import { assignmentApi } from "../services/api";
import { Assignment } from "../types";
import { useRoleGuard } from "../hooks/useRoleGuard";

export default function TeacherAssignmentsScreen() {
  useRoleGuard(["teacher", "admin"]);

  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await assignmentApi.getAll();
      const data = res.data?.data?.assignments ?? res.data?.data ?? [];
      setAssignments(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
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
        <Text style={styles.headerTitle}>Bài tập</Text>
      </View>

      <FlatList
        data={assignments}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={Colors.primary}
          />
        }
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() => router.push(`/teacher/assignments/${item._id}`)}
            >
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.meta}>
                {item.status === "draft"
                  ? "Nháp"
                  : item.status === "published"
                    ? "Đang mở"
                    : "Đã đóng"}
              </Text>
              <Text style={styles.meta}>
                📝 {item.submissionCount ?? (item as any).stats?.submissionCount ?? 0} bài nộp
              </Text>
            </TouchableOpacity>
            {item.status === "draft" && (
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() =>
                  Alert.alert("Xóa", "Xóa bài tập này?", [
                    { text: "Hủy" },
                    {
                      text: "Xóa",
                      onPress: async () => {
                        try {
                          await assignmentApi.delete(item._id);
                          load();
                        } catch (err: any) {
                          Alert.alert("Lỗi", err.message || "Không thể xóa bài tập.");
                        }
                      },
                    },
                  ])
                }
              >
                <Text style={styles.deleteBtnText}>Xóa</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/teacher/assignments/create")}
      >
        <Text style={styles.fabText}>+ Tạo bài tập</Text>
      </TouchableOpacity>
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
  list: { padding: Spacing.lg, paddingBottom: 120 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    ...Shadow.sm,
  },
  title: { ...Typography.body, fontWeight: "700" },
  meta: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 4 },
  deleteBtn: {
    padding: Spacing.sm,
    backgroundColor: Colors.secondaryBackground,
    borderRadius: Radius.md,
    marginLeft: Spacing.md,
  },
  deleteBtnText: {
    ...Typography.bodySmall,
    color: Colors.error,
    fontWeight: "700",
  },
  fab: {
    position: "absolute",
    right: Spacing.lg,
    bottom: Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    ...Shadow.md,
  },
  fabText: { ...Typography.body, color: Colors.surface, fontWeight: "700" },
});

