import React, { useState, useEffect, useCallback } from "react";
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
import { Wifi, PenLine, CalendarDays, FileText } from "lucide-react-native";
import { Colors, Spacing, Typography, Radius, Shadow } from "@/constants/theme";
import { ScoreBadge } from "../components/ScoreBadge";
import { essayApi, getErrorMessage } from "../services/api";
import { HistoryItem } from "../types";
import { formatDate } from "@/utils/bandColor";
import { useAuth } from "../context/AuthContext";

const PAGE_SIZE = 20;

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  scored:  { label: "Đã chấm",    color: Colors.success },
  graded:  { label: "Đã chấm",    color: Colors.success },
  scoring: { label: "Đang chấm…", color: Colors.warning },
  pending: { label: "Đang chờ",   color: Colors.textMuted },
  error:   { label: "Lỗi",        color: Colors.error },
};

// ─── Essay Card ───────────────────────────────────────────────────────────────
function EssayCard({ item, onPress }: { item: HistoryItem; onPress: () => void }) {
  const normalizedStatus = item.status === "grading" ? "scoring" : item.status;
  const status = STATUS_LABELS[normalizedStatus] ?? STATUS_LABELS.pending;
  const displayScore = item.score ?? item.overallScore ?? item.overallBand;
  const assignmentTitle =
    typeof item.assignmentId === "object" ? item.assignmentId?.title : undefined;
  const promptText =
    item.text ??
    item.originalText ??
    item.textPreview ??
    assignmentTitle ??
    (item.taskType === "task2" ? "Bài viết Task 2" : "Bài viết Task 1");

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardTop}>
        <View style={styles.cardLeft}>
          <View style={[styles.statusDot, { backgroundColor: status.color }]} />
          <Text style={[styles.statusLabel, { color: status.color }]}>{status.label}</Text>
          <Text style={styles.taskChip}>{item.taskType === "task2" ? "T2" : "T1"}</Text>
        </View>
        {displayScore != null && <ScoreBadge score={displayScore} size="sm" />}
      </View>

      <Text style={styles.prompt} numberOfLines={2}>{promptText}</Text>

      <View style={styles.cardMeta}>
        <View style={styles.metaItem}>
          <CalendarDays size={12} color={Colors.textMuted} strokeWidth={2} />
          <Text style={styles.metaText}>{formatDate(item.createdAt)}</Text>
        </View>
        <View style={styles.metaItem}>
          <FileText size={12} color={Colors.textMuted} strokeWidth={2} />
          <Text style={styles.metaText}>{item.wordCount} từ</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── History Screen ───────────────────────────────────────────────────────────
export default function HistoryScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [essays, setEssays] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState<number | null>(null);

  const load = useCallback(async (options?: { refresh?: boolean; nextPage?: number }) => {
    const isRefresh = options?.refresh ?? false;
    const nextPage = options?.nextPage ?? 1;

    if (isRefresh) setRefreshing(true);
    else if (nextPage === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const result = await essayApi.getHistory({ page: nextPage, limit: PAGE_SIZE });
      const payload = result.data?.data;
      const list = payload?.essays ?? payload ?? [];
      const pagination = payload?.pagination ?? null;

      setEssays((prev) => (nextPage === 1 ? list : [...prev, ...list]));
      if (pagination) {
        setPage(pagination.page ?? nextPage);
        setHasMore((pagination.page ?? nextPage) < (pagination.pages ?? nextPage));
        setTotal(pagination.total ?? null);
      } else {
        setPage(nextPage);
        setHasMore(Array.isArray(list) ? list.length === PAGE_SIZE : false);
        setTotal(null);
      }
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { load({ refresh: true, nextPage: 1 }); }, [load]);

  // ── Loading ──
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={[Typography.body, { marginTop: Spacing.md, color: Colors.textSecondary }]}>
          Đang tải lịch sử...
        </Text>
      </View>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <View style={styles.center}>
        <View style={styles.emptyIconWrap}>
          <Wifi size={32} color={Colors.textMuted} strokeWidth={1.5} />
        </View>
        <Text style={[Typography.heading3, { marginTop: Spacing.md }]}>Không thể kết nối</Text>
        <Text style={[Typography.body, { color: Colors.textSecondary, textAlign: "center", marginTop: Spacing.sm }]}>
          {error}
        </Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => load({ refresh: true, nextPage: 1 })}>
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Empty ──
  if (essays.length === 0) {
    const isTeacher = user?.role === "teacher";
    return (
      <View style={styles.center}>
        <View style={styles.emptyIconWrap}>
          <PenLine size={32} color={Colors.primary} strokeWidth={1.5} />
        </View>
        <Text style={[Typography.heading3, { marginTop: Spacing.md }]}>Chưa có bài luận</Text>
        <Text style={[Typography.body, { color: Colors.textSecondary, textAlign: "center", marginTop: Spacing.sm }]}>
          {isTeacher
            ? "Bài luận của học sinh sẽ xuất hiện ở đây sau khi họ nộp bài."
            : "Nộp bài luận đầu tiên để xem kết quả tại đây"}
        </Text>
      </View>
    );
  }

  const totalLabel = total ?? essays.length;

  return (
    <View style={styles.container}>
      <FlatList
        data={essays}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <EssayCard
            item={item}
            onPress={() =>
              router.push({ pathname: "/essay/detail", params: { essayId: item._id } })
            }
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load({ refresh: true, nextPage: 1 })}
            tintColor={Colors.primary}
          />
        }
        ListHeaderComponent={
          <Text style={styles.listHeader}>{totalLabel} bài</Text>
        }
        onEndReached={() => {
          if (!loading && !refreshing && !loadingMore && hasMore) {
            load({ nextPage: page + 1 });
          }
        }}
        onEndReachedThreshold={0.6}
        ListFooterComponent={
          loadingMore ? (
            <View style={{ paddingVertical: Spacing.md }}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },

  // Empty / error icon container
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
  },

  // List
  list: { padding: Spacing.lg, paddingBottom: 32 },
  listHeader: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
    marginTop: 30,
    fontWeight: "700",
    textTransform: "uppercase",
  },

  // Card
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  cardLeft: { flexDirection: "row", alignItems: "center", gap: Spacing.xs },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: {
    ...Typography.caption,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  taskChip: {
    ...Typography.caption,
    backgroundColor: Colors.primaryLight,
    color: Colors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
    fontWeight: "700",
    marginLeft: Spacing.xs,
  },
  prompt: {
    ...Typography.body,
    lineHeight: 22,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },

  // Meta row
  cardMeta: { flexDirection: "row", gap: Spacing.md },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { ...Typography.bodySmall, color: Colors.textMuted },

  // Retry
  retryBtn: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.xxxl,
    paddingVertical: 14,
  },
  retryText: { ...Typography.body, color: Colors.surface, fontWeight: "700" },
});