import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Colors, Spacing, Typography, Radius, Shadow } from "@/constants/theme";
import { assignmentApi } from "../services/api";
import { useRoleGuard } from "../hooks/useRoleGuard";
import { useBack } from "../hooks/useBack";

export default function TeacherAssignmentSubmissionsScreen() {
  useRoleGuard(["teacher", "admin"]);

  const router = useRouter();
  const goBack = useBack("/teacher/assignments");
  const { id } = useLocalSearchParams<{ id: string }>();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await assignmentApi.getSubmissions(id);
      const data = res.data?.data?.submissions ?? res.data?.data?.essays ?? res.data?.data ?? [];
      setSubmissions(data);
    } finally {
      setLoading(false);
    }
  }, [id]);

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
        <TouchableOpacity onPress={goBack}>
          <Text style={styles.backText}>Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bài nộp</Text>
        <View style={{ width: 60 }} />
      </View>

      <FlatList
        data={submissions}
        keyExtractor={(item, idx) => String(item._id ?? idx)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: "/teacher/essays/[essayId]",
                params: { essayId: item._id },
              })
            }
            activeOpacity={0.8}
          >
            <Text style={styles.title}>{item.studentId?.name ?? "Học sinh"}</Text>
            <Text style={styles.meta}>Trạng thái: {item.status}</Text>
            <Text style={styles.meta}>Điểm: {item.overallScore ?? "-"}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
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



