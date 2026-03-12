import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Colors, Spacing, Typography, Radius, Shadow } from "@/constants/theme";
import { classApi } from "../services/api";
import { Class } from "../types";

export default function TeacherDashboardScreen() {
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await classApi.getAll();
      const data = res.data?.data?.classes ?? res.data?.data ?? [];
      setClasses(data);
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Network error");
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
        <Text style={styles.headerTitle}>Teacher Dashboard</Text>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => router.push("/teacher/classes/create")}
        >
          <Text style={styles.headerBtnText}>+ Tạo lớp</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={Colors.primary}
          />
        }
      >
        <Text style={styles.sectionTitle}>Lớp học của tôi</Text>

        {classes.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Chưa có lớp học</Text>
            <Text style={styles.emptySub}>
              Tạo lớp đầu tiên để mời học sinh và giao bài tập.
            </Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => router.push("/teacher/classes/create")}
            >
              <Text style={styles.primaryBtnText}>+ Tạo lớp mới</Text>
            </TouchableOpacity>
          </View>
        ) : (
          classes.map((cls) => (
            <TouchableOpacity
              key={cls._id}
              style={styles.classCard}
              onPress={() =>
                router.push({
                  pathname: "/teacher/classes/[classId]",
                  params: { classId: cls._id, backTo: "dashboard" },
                })
              }
            >
              <View style={styles.classCardLeft}>
                <Text style={styles.className}>{cls.name}</Text>
                <Text style={styles.classCode}>Mã lớp: {cls.code}</Text>
              </View>
              <View style={styles.classCardRight}>
                <Text style={styles.classStudentCount}>
                  {(cls.studentIds?.length ?? 0)} học sinh
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        <TouchableOpacity
          style={styles.quickActionBtn}
          onPress={() => router.push("/teacher/assignments/create")}
        >
          <Text style={styles.quickActionText}>+ Tạo bài tập mới</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: Spacing.xl,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  headerTitle: { ...Typography.heading2, color: Colors.surface, fontWeight: "800" },
  headerBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: Radius.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  headerBtnText: { ...Typography.bodySmall, color: Colors.surface, fontWeight: "700" },
  content: { padding: Spacing.lg },
  sectionTitle: { ...Typography.heading3, marginBottom: Spacing.md },
  classCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  classCardLeft: { flex: 1 },
  className: { ...Typography.body, fontWeight: "700" },
  classCode: { ...Typography.bodySmall, color: Colors.textMuted, marginTop: 4 },
  classCardRight: { alignItems: "flex-end" },
  classStudentCount: { ...Typography.bodySmall, fontWeight: "700" },
  quickActionBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    alignItems: "center",
    ...Shadow.md,
    marginTop: Spacing.md,
  },
  quickActionText: { ...Typography.body, color: Colors.surface, fontWeight: "700" },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  emptyTitle: { ...Typography.heading3 },
  emptySub: { ...Typography.body, color: Colors.textSecondary, marginTop: 6 },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: Spacing.lg,
    ...Shadow.md,
  },
  primaryBtnText: { ...Typography.body, color: Colors.surface, fontWeight: "700" },
});
