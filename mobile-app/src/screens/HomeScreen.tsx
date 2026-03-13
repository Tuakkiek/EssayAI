import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { Colors, Spacing, Typography, Radius, Shadow } from "@/constants/theme";
import { studentApi } from "../services/api";
import { Assignment } from "../types";
import { formatDate } from "@/utils/bandColor";
import { useAuth } from "../context/AuthContext";
import { useRoleGuard } from "../hooks/useRoleGuard";
import { SFIcon } from "../components/SFIcon";

export default function HomeScreen() {
  useRoleGuard(["center_student", "free_student"]);

  const router = useRouter();
  const { user } = useAuth();
  const [myClass, setMyClass] = useState<any>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
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
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const firstName = user?.name?.trim().split(" ")[0] || "Bạn";
  const lastName = user?.name?.trim().split(" ").slice(1).join(" ") || "";
  const isCenterStudent = user?.role === "center_student";

  const {
    nextAssignment,
    upcomingAssignments,
    pendingCount,
    submittedCount,
    dueSoonCount,
  } = useMemo(() => {
    const sorted = [...assignments].sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    );
    const pending = sorted.filter((a) => !a.mySubmission);
    const dueSoon = pending.filter(
      (a) => new Date(a.dueDate).getTime() < Date.now() + 3 * 86400000,
    );
    return {
      nextAssignment: pending[0] ?? null,
      upcomingAssignments: sorted.slice(0, 3),
      pendingCount: pending.length,
      submittedCount: Math.max(0, sorted.length - pending.length),
      dueSoonCount: dueSoon.length,
    };
  }, [assignments]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.tint} />
      </View>
    );
  }

  const handlePrimaryAction = () => {
    if (nextAssignment) {
      router.push(`/student/assignments/${nextAssignment._id}`);
    } else {
      router.push("/essay/input");
    }
  };

  const renderUpcoming = (item: Assignment, index: number) => {
    const isOverdue = new Date(item.dueDate) < new Date();
    const status = item.mySubmission
      ? "Đã nộp"
      : isOverdue
        ? "Hết hạn"
        : "Chưa nộp";
    const statusColor = item.mySubmission
      ? Colors.text
      : isOverdue
        ? Colors.error
        : Colors.textSecondary;

    return (
      <Pressable
        key={item._id}
        style={({ pressed }) => [
          styles.row,
          index > 0 && styles.rowDivider,
          pressed && styles.rowPressed,
        ]}
        onPress={() => router.push(`/student/assignments/${item._id}`)}
      >
        <View style={styles.rowHeader}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <SFIcon
            name="chevron.right"
            size={14}
            color={Colors.textMuted}
            fallbackName="chevron-forward"
          />
        </View>
        <Text style={styles.rowMeta}>Hạn: {formatDate(item.dueDate)}</Text>
        <View style={styles.rowFooter}>
          <View style={styles.badge}>
            <Text style={[styles.badgeText, { color: statusColor }]}>
              {status}
            </Text>
          </View>
          {item.mySubmission?.overallScore != null && (
            <Text style={styles.rowScore}>
              Band {item.mySubmission.overallScore?.toFixed(1)}
            </Text>
          )}
        </View>
      </Pressable>
    );
  };

  const nextDueText = nextAssignment
    ? `Hạn: ${formatDate(nextAssignment.dueDate)}`
    : "Không có bài tập gần hạn";
  const isNextOverdue = nextAssignment
    ? new Date(nextAssignment.dueDate) < new Date()
    : false;
  const primaryLabel = nextAssignment
    ? isNextOverdue
      ? "Nộp ngay"
      : "Bắt đầu"
    : "Viết bài mới";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadData(true)}
            tintColor={Colors.tint}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>
            {firstName} {lastName}
          </Text>
          {isCenterStudent && myClass ? (
            <Text style={styles.headerSub}>
              Lớp {myClass.class?.name}{" "}
              {(myClass.class.centerId as any)?.name
                ? `- Trung tâm ${(myClass.class.centerId as any).name}`
                : ""}
            </Text>
          ) : (
            <Text style={styles.headerSub}>Tổng quan học tập hôm nay</Text>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.accentDot} />
            <Text style={[styles.sectionTitle, styles.sectionTitleAccent]}>
              Việc tiếp theo
            </Text>
          </View>
          <View style={[styles.card, styles.cardAccent]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {nextAssignment ? nextAssignment.title : "Chưa có bài tập mới"}
              </Text>
              <SFIcon
                name="bolt"
                size={18}
                color={Colors.textSecondary}
                fallbackName="flash-outline"
              />
            </View>
            <Text style={styles.cardMeta}>{nextDueText}</Text>
            <Pressable
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && styles.primaryBtnPressed,
              ]}
              onPress={handlePrimaryAction}
            >
              <Text style={styles.primaryBtnText}>{primaryLabel}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tổng quan</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{pendingCount}</Text>
              <Text style={styles.statLabel}>Chưa nộp</Text>
            </View>
            <View style={styles.statCard}>
              <Text
                style={[
                  styles.statValue,
                  dueSoonCount > 0 && styles.statValueAccent,
                ]}
              >
                {dueSoonCount}
              </Text>
              <Text style={styles.statLabel}>Sắp đến hạn</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{submittedCount}</Text>
              <Text style={styles.statLabel}>Đã nộp</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lối tắt</Text>
          <View style={styles.listCard}>
            <Pressable
              style={({ pressed }) => [
                styles.listRow,
                pressed && styles.rowPressed,
              ]}
              onPress={() => router.push("/student/assignments")}
            >
              <View style={styles.listRowLeft}>
                <SFIcon
                  name="doc.text"
                  size={18}
                  color={Colors.textSecondary}
                  fallbackName="clipboard-outline"
                />
                <Text style={styles.listRowText}>Bài tập chưa nộp</Text>
              </View>
              <SFIcon
                name="chevron.right"
                size={14}
                color={Colors.textMuted}
                fallbackName="chevron-forward"
              />
            </Pressable>
            <View style={styles.divider} />
            <Pressable
              style={({ pressed }) => [
                styles.listRow,
                pressed && styles.rowPressed,
              ]}
              onPress={() => router.push("/history")}
            >
              <View style={styles.listRowLeft}>
                <SFIcon
                  name="clock"
                  size={18}
                  color={Colors.textSecondary}
                  fallbackName="time-outline"
                />
                <Text style={styles.listRowText}>Lịch sử chấm bài</Text>
              </View>
              <SFIcon
                name="chevron.right"
                size={14}
                color={Colors.textMuted}
                fallbackName="chevron-forward"
              />
            </Pressable>
            <View style={styles.divider} />
            <Pressable
              style={({ pressed }) => [
                styles.listRow,
                pressed && styles.rowPressed,
              ]}
              onPress={() => router.push("/subscription")}
            >
              <View style={styles.listRowLeft}>
                <SFIcon
                  name="star"
                  size={18}
                  color={Colors.tint}
                  fallbackName="star-outline"
                />
                <Text style={[styles.listRowText, styles.listRowTextAccent]}>
                  Nâng cấp tài khoản
                </Text>
              </View>
              <SFIcon
                name="chevron.right"
                size={14}
                color={Colors.textMuted}
                fallbackName="chevron-forward"
              />
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bài tập gần đây</Text>
          {upcomingAssignments.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.emptyText}>Chưa có bài tập</Text>
              <Text style={styles.emptySub}>
                Khi có bài mới, chúng sẽ xuất hiện ở đây.
              </Text>
            </View>
          ) : (
            <View style={styles.listCard}>
              {upcomingAssignments.map((item, index) =>
                renderUpcoming(item, index),
              )}
            </View>
          )}
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.groupedBackground },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { paddingBottom: Spacing.lg },
  header: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  greeting: {
    ...Typography.largeTitle,
  },
  headerSub: {
    ...Typography.subhead,
    marginTop: Spacing.xs,
  },
  section: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.label,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  sectionTitleAccent: {
    color: Colors.tint,
  },
  accentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.tint,
  },
  card: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.separator,
    ...Shadow.sm,
  },
  cardAccent: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.tint,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  cardTitle: { ...Typography.heading3, flex: 1 },
  cardMeta: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: Spacing.md,
  },
  primaryBtnPressed: { opacity: 0.85 },
  primaryBtnText: {
    ...Typography.body,
    color: Colors.onPrimary,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.separator,
  },
  statValue: { ...Typography.heading3 },
  statValueAccent: { color: Colors.tint },
  statLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  listCard: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.separator,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  listRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  listRowText: { ...Typography.body },
  listRowTextAccent: { color: Colors.tint },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.separator,
    marginLeft: Spacing.md,
  },
  row: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  rowPressed: { opacity: 0.7 },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.separator,
  },
  rowHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  rowTitle: { ...Typography.body, fontWeight: "600", flex: 1 },
  rowMeta: { ...Typography.caption, color: Colors.textSecondary, marginTop: 4 },
  rowFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  badge: {
    borderRadius: Radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.separator,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  badgeText: { ...Typography.caption },
  rowScore: { ...Typography.caption, color: Colors.text },
  emptyText: { ...Typography.body, textAlign: "center" },
  emptySub: {
    ...Typography.caption,
    textAlign: "center",
    marginTop: Spacing.xs,
    color: Colors.textSecondary,
  },
});
