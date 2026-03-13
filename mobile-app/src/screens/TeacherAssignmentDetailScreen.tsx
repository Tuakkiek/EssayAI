import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Colors, Spacing, Typography, Radius, Shadow } from "@/constants/theme";
import { assignmentApi, getErrorMessage } from "../services/api";
import { Assignment } from "../types";
import { useRoleGuard } from "../hooks/useRoleGuard";
import { useBack } from "../hooks/useBack";

export default function TeacherAssignmentDetailScreen() {
  useRoleGuard(["teacher", "admin"]);

  const router = useRouter();
  const goBack = useBack("/teacher/assignments");
  const { id } = useLocalSearchParams<{ id: string }>();
  const [assignment, setAssignment] = useState<Assignment | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    const res = await assignmentApi.getById(id);
    setAssignment(res.data?.data?.assignment ?? null);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAction = async (action: "publish" | "close" | "delete") => {
    if (!id) return;
    try {
      if (action === "publish") await assignmentApi.publish(id);
      if (action === "close") await assignmentApi.close(id);
      if (action === "delete") await assignmentApi.delete(id);
      load();
    } catch (err) {
      Alert.alert("Error", getErrorMessage(err));
    }
  };

  if (!assignment) {
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack}>
          <Text style={styles.backText}>Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết bài tập</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{assignment.title}</Text>
        <Text style={styles.meta}>
          Trạng thái:{" "}
          {assignment.status === "draft"
            ? "Nháp"
            : assignment.status === "published"
              ? "Đang mở"
              : "Đã đóng"}
        </Text>
        <Text style={styles.meta}>Hạn nộp: {new Date(assignment.dueDate).toLocaleDateString('vi-VN')}</Text>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push(`/teacher/assignments/${id}/submissions`)}
        >
          <Text style={styles.primaryBtnText}>Xem bài nộp</Text>
        </TouchableOpacity>

        {assignment.status === "draft" && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleAction("publish")}
          >
            <Text style={styles.actionBtnText}>Xuất bản</Text>
          </TouchableOpacity>
        )}

        {assignment.status === "published" && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleAction("close")}
          >
            <Text style={styles.actionBtnText}>Đóng bài tập</Text>
          </TouchableOpacity>
        )}

        {assignment.status === "draft" && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: Colors.error }]}
            onPress={() =>
              Alert.alert("Xóa", "Xóa bài tập này?", [
                { text: "Hủy" },
                { text: "Xóa", onPress: () => handleAction("delete") },
              ])
            }
          >
            <Text style={[styles.actionBtnText, { color: Colors.surface }]}>Xóa</Text>
          </TouchableOpacity>
        )}
      </View>
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
  content: { padding: Spacing.lg },
  title: { ...Typography.heading3, marginBottom: Spacing.sm },
  meta: { ...Typography.bodySmall, color: Colors.textSecondary, marginBottom: Spacing.xs },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: Spacing.md,
    ...Shadow.md,
  },
  primaryBtnText: { ...Typography.body, color: Colors.surface, fontWeight: "700" },
  actionBtn: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.lg,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: Spacing.md,
  },
  actionBtnText: { ...Typography.body, fontWeight: "700" },
});



