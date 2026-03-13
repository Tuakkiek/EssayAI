import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Colors, Spacing, Typography, Radius, Shadow } from "@/constants/theme";
import { studentApi } from "../services/api";
import { Assignment } from "../types";
import { formatDate } from "@/utils/bandColor";
import { useRoleGuard } from "../hooks/useRoleGuard";

// ─── Lucide React Native icons ────────────────────────────────────────────────
import {
  BookOpen,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  User,
  Award,
  CalendarDays,
} from "lucide-react-native";

// ─── Design tokens (Apple-style) ──────────────────────────────────────────────
const APPLE = {
  bg: "#F2F2F7",          // iOS system grouped background
  surface: "#FFFFFF",
  surfaceSecondary: "#F2F2F7",
  separator: "#C6C6C8",
  label: "#000000",
  labelSecondary: "#3C3C43CC",  // 80% opacity
  labelTertiary: "#3C3C4399",   // 60% opacity
  blue: "#007AFF",
  green: "#34C759",
  red: "#FF3B30",
  orange: "#FF9500",
  indigo: "#5856D6",
  headerBg: "#FFFFFF",
  headerBorder: "#E5E5EA",
};

// ─── Status config ─────────────────────────────────────────────────────────────
type StatusKey = "submitted" | "expired" | "pending";

const STATUS_CONFIG: Record<
  StatusKey,
  { label: string; color: string; bg: string; Icon: React.ComponentType<any> }
> = {
  submitted: {
    label: "Đã nộp",
    color: APPLE.green,
    bg: "#34C75918",
    Icon: CheckCircle2,
  },
  expired: {
    label: "Hết hạn",
    color: APPLE.red,
    bg: "#FF3B3018",
    Icon: XCircle,
  },
  pending: {
    label: "Chưa nộp",
    color: APPLE.orange,
    bg: "#FF950018",
    Icon: AlertCircle,
  },
};

function getStatus(item: Assignment): StatusKey {
  if (item.mySubmission) return "submitted";
  if (new Date(item.dueDate) < new Date()) return "expired";
  return "pending";
}

// ─── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ statusKey }: { statusKey: StatusKey }) {
  const { label, color, bg, Icon } = STATUS_CONFIG[statusKey];
  return (
    <View style={[badgeStyles.badge, { backgroundColor: bg }]}>
      <Icon size={11} color={color} strokeWidth={2.5} />
      <Text style={[badgeStyles.label, { color }]}>{label}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
});

// ─── Score Pill ────────────────────────────────────────────────────────────────
function ScorePill({ score }: { score: number }) {
  const color =
    score >= 7 ? APPLE.green : score >= 5 ? APPLE.orange : APPLE.red;
  return (
    <View style={[scorePillStyles.pill, { borderColor: color + "40" }]}>
      <Award size={11} color={color} strokeWidth={2.5} />
      <Text style={[scorePillStyles.text, { color }]}>
        Band {score.toFixed(1)}
      </Text>
    </View>
  );
}

const scorePillStyles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: "#FFFFFF",
  },
  text: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
});

// ─── Assignment Card ───────────────────────────────────────────────────────────
function AssignmentCard({
  item,
  onPress,
}: {
  item: Assignment;
  onPress: () => void;
}) {
  const statusKey = getStatus(item);
  const isDueSoon =
    new Date(item.dueDate) < new Date(Date.now() + 86400000) &&
    statusKey === "pending";
  const teacherName = (item as any).teacherId?.name ?? "";

  return (
    <TouchableOpacity
      style={cardStyles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Top row: title + chevron */}
      <View style={cardStyles.topRow}>
        <View style={cardStyles.iconWrap}>
          <BookOpen size={18} color={APPLE.blue} strokeWidth={2} />
        </View>
        <Text style={cardStyles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <ChevronRight size={16} color={APPLE.separator} strokeWidth={2} />
      </View>

      {/* Divider */}
      <View style={cardStyles.divider} />

      {/* Meta row */}
      <View style={cardStyles.metaRow}>
        {/* Teacher */}
        {teacherName ? (
          <View style={cardStyles.metaItem}>
            <User size={12} color={APPLE.labelTertiary} strokeWidth={2} />
            <Text style={cardStyles.metaText} numberOfLines={1}>
              {teacherName}
            </Text>
          </View>
        ) : null}

        {/* Due date */}
        <View style={cardStyles.metaItem}>
          <CalendarDays
            size={12}
            color={isDueSoon ? APPLE.red : APPLE.labelTertiary}
            strokeWidth={2}
          />
          <Text
            style={[
              cardStyles.metaText,
              isDueSoon && { color: APPLE.red, fontWeight: "600" },
            ]}
          >
            {formatDate(item.dueDate)}
          </Text>
        </View>
      </View>

      {/* Bottom row: status + score */}
      <View style={cardStyles.footerRow}>
        <StatusBadge statusKey={statusKey} />
        {item.mySubmission?.overallScore != null && (
          <ScorePill score={item.mySubmission.overallScore} />
        )}
      </View>
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: APPLE.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: APPLE.blue + "14",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: APPLE.label,
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: APPLE.headerBorder,
    marginBottom: 10,
    marginLeft: 44,
  },
  metaRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 10,
    marginLeft: 44,
    flexWrap: "wrap",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: APPLE.labelSecondary,
    fontWeight: "400",
    letterSpacing: 0.1,
  },
  footerRow: {
    flexDirection: "row",
    gap: 6,
    marginLeft: 44,
    flexWrap: "wrap",
  },
});

// ─── Empty State ───────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <View style={emptyStyles.wrap}>
      <View style={emptyStyles.iconCircle}>
        <BookOpen size={32} color={APPLE.blue} strokeWidth={1.5} />
      </View>
      <Text style={emptyStyles.title}>Chưa có bài tập</Text>
      <Text style={emptyStyles.sub}>
        Bài tập được giao sẽ hiển thị tại đây.
      </Text>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: APPLE.blue + "14",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    color: APPLE.label,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  sub: {
    fontSize: 14,
    color: APPLE.labelSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
});

// ─── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ count }: { count: number }) {
  return (
    <View style={sectionStyles.row}>
      <Text style={sectionStyles.label}>
        {count} bài tập
      </Text>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  row: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    paddingTop: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: APPLE.labelTertiary,
    letterSpacing: 0.1,
    textTransform: "uppercase",
  },
});

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function StudentAssignmentsScreen() {
  useRoleGuard(["center_student", "free_student"]);

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
        <StatusBar barStyle="dark-content" backgroundColor={APPLE.headerBg} />
        <ActivityIndicator size="large" color={APPLE.blue} />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={APPLE.headerBg} />

      {/* Navigation bar (Apple Large Title style) */}
      <View style={styles.navbar}>
        <Text style={styles.navTitle}>Bài tập</Text>
        <Text style={styles.navSub}>được giao</Text>
      </View>

      <FlatList
        data={assignments}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          assignments.length > 0 ? (
            <SectionHeader count={assignments.length} />
          ) : null
        }
        ListEmptyComponent={<EmptyState />}
        renderItem={({ item }) => (
          <AssignmentCard
            item={item}
            onPress={() => router.push(`/student/assignments/${item._id}`)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APPLE.bg,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: APPLE.bg,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: APPLE.labelSecondary,
    fontWeight: "500",
  },

  // ── Navigation Bar ────────────────────────────────
  navbar: {
    backgroundColor: APPLE.headerBg,
    paddingTop: Platform.OS === "ios" ? 56 : 40,
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: APPLE.headerBorder,
  },
  navTitle: {
    fontSize: 34,
    fontWeight: "700",
    color: APPLE.label,
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  navSub: {
    fontSize: 14,
    fontWeight: "400",
    color: APPLE.labelSecondary,
    letterSpacing: 0.1,
    marginTop: 2,
  },

  list: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },
});