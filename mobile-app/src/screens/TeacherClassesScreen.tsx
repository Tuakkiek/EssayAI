import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Colors, Spacing, Typography, Radius, Shadow } from "@/constants/theme";
import { classApi, assignmentApi } from "../services/api";
import { Assignment, Class } from "../types";
import { useRoleGuard } from "../hooks/useRoleGuard";

export default function TeacherClassesScreen() {
  useRoleGuard(["teacher", "admin"]);

  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [clsRes, assignRes] = await Promise.all([
        classApi.getAll(),
        assignmentApi.getAll(),
      ]);
      const cls = clsRes.data?.data?.classes ?? clsRes.data?.data ?? [];
      const asg = assignRes.data?.data?.assignments ?? assignRes.data?.data ?? [];
      setClasses(cls);
      setAssignments(asg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const activeCountByClass = useMemo(() => {
    const map = new Map<string, number>();
    assignments.forEach((a) => {
      if (a.status !== "published") return;
      const cid = (a.classId as any)?._id ?? (a.classId as any) ?? "";
      if (!cid) return;
      map.set(cid, (map.get(cid) ?? 0) + 1);
    });
    return map;
  }, [assignments]);

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
        <Text style={styles.headerTitle}>Lớp học</Text>
      </View>

      <FlatList
        data={classes}
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
            <View style={styles.cardHeader}>
              <Text style={styles.className}>{item.name}</Text>
              <Text style={styles.classCode}>Mã lớp: {item.code}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>
                Học sinh: {item.studentIds?.length ?? 0}
              </Text>
              <Text style={styles.metaText}>
                Bài tập đang mở: {activeCountByClass.get(item._id) ?? 0}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.detailBtn}
              onPress={() =>
                router.push({
                  pathname: "/teacher/classes/[classId]",
                  params: { classId: item._id, backTo: "classes" },
                })
              }
            >
              <Text style={styles.detailBtnText}>Xem chi tiết</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Chưa có lớp học</Text>
            <Text style={styles.emptySub}>
              Tạo lớp mới để bắt đầu quản lý học sinh.
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/teacher/classes/create")}
      >
        <Text style={styles.fabText}>+ Tạo lớp mới</Text>
      </TouchableOpacity>
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
  list: { padding: Spacing.lg, paddingBottom: 120 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  cardHeader: { marginBottom: Spacing.sm },
  className: { ...Typography.body, fontWeight: "700" },
  classCode: { ...Typography.caption, color: Colors.textMuted, marginTop: 4 },
  metaRow: { flexDirection: "row", justifyContent: "space-between" },
  metaText: { ...Typography.bodySmall, color: Colors.textSecondary },
  detailBtn: {
    marginTop: Spacing.md,
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.md,
    paddingVertical: 10,
    alignItems: "center",
  },
  detailBtnText: { ...Typography.bodySmall, color: Colors.primary, fontWeight: "700" },
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
  empty: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: "center",
    ...Shadow.sm,
  },
  emptyTitle: { ...Typography.heading3 },
  emptySub: { ...Typography.body, color: Colors.textSecondary, marginTop: 6 },
});


