/**
 * HomeScreen — Student home.
 * Spec: single primary action, motivating, minimal, no density.
 * Max 3 sections visible at once.
 */
import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { Colors, Radius, Shadow, Spacing, Typography } from "../constants/theme";
import { AppButton } from "../components/AppButton";
import { studentApi } from "../services/api";
import { Assignment } from "../types";
import { formatDate } from "../utils/bandColor";
import { useAuth } from "../context/AuthContext";
import { useRoleGuard } from "../hooks/useRoleGuard";
import { ChevronRight, BookOpen, Star, Flame } from "lucide-react-native";

// ── Greeting helper ───────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

// ── Assignment row ────────────────────────────────────────────────────────────
function AssignmentRow({
  item,
  onPress,
}: {
  item: Assignment;
  onPress: () => void;
}) {
  const isOverdue = new Date(item.dueDate) < new Date();
  const isDueSoon = !isOverdue && new Date(item.dueDate) < new Date(Date.now() + 3 * 86400000);
  const submitted = !!item.mySubmission;

  const statusColor = submitted
    ? Colors.primary
    : isOverdue
      ? Colors.errorSoft
      : isDueSoon
        ? Colors.warning
        : Colors.textMuted;

  const statusLabel = submitted
    ? "Submitted ✓"
    : isOverdue
      ? "Overdue"
      : isDueSoon
        ? "Due soon"
        : formatDate(item.dueDate);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.asgRow, pressed && { opacity: 0.75 }]}
    >
      <View style={styles.asgLeft}>
        <Text style={styles.asgTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={[styles.asgMeta, { color: statusColor }]}>{statusLabel}</Text>
      </View>
      {item.mySubmission?.overallScore != null ? (
        <Text style={[styles.asgScore, { color: Colors.primary }]}>
          {item.mySubmission.overallScore.toFixed(1)}
        </Text>
      ) : (
        <ChevronRight size={16} color={Colors.textMuted} strokeWidth={2} />
      )}
    </Pressable>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function HomeScreen() {
  useRoleGuard(["center_student", "free_student"]);

  const router = useRouter();
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await studentApi.getAssignments();
      const data = res.data?.data?.assignments ?? res.data?.data ?? [];
      setAssignments(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const firstName = user?.name?.trim().split(" ").pop() ?? "there";
  const isCenterStudent = user?.role === "center_student";

  const { nextAssignment, pendingCount, dueSoonCount } = useMemo(() => {
    const pending = assignments.filter((a) => !a.mySubmission);
    const dueSoon = pending.filter(
      (a) => new Date(a.dueDate).getTime() < Date.now() + 3 * 86400000,
    );
    return {
      nextAssignment: pending.sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
      )[0] ?? null,
      pendingCount: pending.length,
      dueSoonCount: dueSoon.length,
    };
  }, [assignments]);

  const primaryAction = {
    label: nextAssignment ? "Start Assignment" : "Write an Essay",
    onPress: () => {
      if (nextAssignment) router.push(`/student/assignments/${nextAssignment._id}`);
      else router.push("/essay/input");
    },
    hint: nextAssignment
      ? `Due ${formatDate(nextAssignment.dueDate)}`
      : "Practice free writing",
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadData(true)}
            tintColor={Colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── Section 1: Greeting — max 1 ── */}
        <View style={styles.greeting}>
          <Text style={styles.greetingLabel}>{getGreeting()},</Text>
          <Text style={styles.greetingName}>{firstName} 👋</Text>
        </View>

        {/* ── Section 2: Primary action card — single CTA per spec ── */}
        <View style={[styles.heroCard, Shadow.md]}>
          {nextAssignment ? (
            <>
              <View style={styles.heroIcon}>
                <BookOpen size={22} color={Colors.primary} strokeWidth={2} />
              </View>
              <Text style={styles.heroTitle} numberOfLines={2}>
                {nextAssignment.title}
              </Text>
              <Text style={styles.heroHint}>{primaryAction.hint}</Text>
            </>
          ) : (
            <>
              <View style={styles.heroIcon}>
                <Star size={22} color={Colors.primary} strokeWidth={2} />
              </View>
              <Text style={styles.heroTitle}>Ready to practice?</Text>
              <Text style={styles.heroHint}>{primaryAction.hint}</Text>
            </>
          )}
          {/* Single primary action */}
          <AppButton
            label={primaryAction.label}
            onPress={primaryAction.onPress}
            size="lg"
            style={{ marginTop: Spacing.sm }}
          />
        </View>

        {/* ── Section 3: Quick stats — max 3 chips ── */}
        {isCenterStudent && (pendingCount > 0 || dueSoonCount > 0) ? (
          <View style={styles.statsRow}>
            <View style={styles.statChip}>
              <Text style={styles.statVal}>{pendingCount}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            {dueSoonCount > 0 && (
              <View style={[styles.statChip, styles.statChipWarning]}>
                <Flame size={14} color={Colors.warning} strokeWidth={2} />
                <Text style={[styles.statVal, { color: Colors.warning }]}>
                  {dueSoonCount}
                </Text>
                <Text style={styles.statLabel}>Due soon</Text>
              </View>
            )}
            <View style={styles.statChip}>
              <Text style={styles.statVal}>{assignments.length - pendingCount}</Text>
              <Text style={styles.statLabel}>Done</Text>
            </View>
          </View>
        ) : null}

        {/* ── Assignments list (max 4 items for density spec) ── */}
        {assignments.length > 0 && (
          <View style={[styles.listCard, Shadow.xs]}>
            <Text style={styles.listTitle}>Assignments</Text>
            {assignments.slice(0, 4).map((a, i) => (
              <View key={a._id}>
                {i > 0 && <View style={styles.rowDivider} />}
                <AssignmentRow
                  item={a}
                  onPress={() => router.push(`/student/assignments/${a._id}`)}
                />
              </View>
            ))}
            {assignments.length > 4 && (
              <Pressable
                onPress={() => router.push("/student/assignments")}
                style={({ pressed }) => [styles.seeAll, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.seeAllText}>
                  See all {assignments.length} assignments
                </Text>
                <ChevronRight size={14} color={Colors.primary} strokeWidth={2.5} />
              </Pressable>
            )}
          </View>
        )}

        {/* ── Shortcut: History ── */}
        <Pressable
          onPress={() => router.push("/history")}
          style={({ pressed }) => [styles.shortcut, Shadow.xs, pressed && { opacity: 0.75 }]}
        >
          <Text style={styles.shortcutText}>View essay history</Text>
          <ChevronRight size={16} color={Colors.primary} strokeWidth={2.5} />
        </Pressable>

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { padding: Spacing.md, gap: Spacing.md },

  // Greeting
  greeting: { paddingTop: Spacing.xs, paddingBottom: Spacing.xs },
  greetingLabel: {
    ...Typography.body,
    color: Colors.textMuted,
  },
  greetingName: {
    ...Typography.largeTitle,
    color: Colors.text,
    marginTop: 2,
  },

  // Hero card
  heroCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xxl,
    padding: Spacing.xl,
    gap: Spacing.xs,
  },
  heroIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  heroTitle: {
    ...Typography.title2,
    color: Colors.text,
  },
  heroHint: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
  },

  // Stats row
  statsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  statChip: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    alignItems: "center",
    gap: 2,
    ...Shadow.xs,
  },
  statChipWarning: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 4,
    backgroundColor: Colors.warningLight,
  },
  statVal: {
    ...Typography.title2,
    color: Colors.text,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
  },

  // List card
  listCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    overflow: "hidden",
  },
  listTitle: {
    ...Typography.label,
    color: Colors.textMuted,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  asgRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  asgLeft: { flex: 1 },
  asgTitle: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  asgMeta: {
    ...Typography.caption,
    marginTop: 2,
  },
  asgScore: {
    ...Typography.title3,
    fontWeight: "800",
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.divider,
    marginLeft: Spacing.md,
  },
  seeAll: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    gap: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.divider,
  },
  seeAllText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: "700",
  },

  // Shortcut
  shortcut: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  shortcutText: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
});
