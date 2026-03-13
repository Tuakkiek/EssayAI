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
import { Colors, Spacing, Typography, Radius, Shadow } from "@/constants/theme";
import { ScoreBadge } from "../components/ScoreBadge";
import { essayApi, getErrorMessage } from "../services/api";
import { HistoryItem } from "../types";
import { formatDate } from "@/utils/bandColor";
import { useAuth } from "../context/AuthContext";

const PAGE_SIZE = 20;

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  scored: { label: "Đã chấm", color: Colors.success },
  graded: { label: "Đã chấm", color: Colors.success },
  scoring: { label: "Đang chấm…", color: Colors.warning },
  pending: { label: "Đang chờ", color: Colors.textMuted },
  error: { label: "Lỗi", color: Colors.error },
};

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
          <Text style={styles.statusLabel}>{status.label}</Text>
          <Text style={styles.taskChip}>{item.taskType === "task2" ? "T2" : "T1"}</Text>
        </View>
        {displayScore != null && (
          <ScoreBadge score={displayScore} size="sm" />
        )}
      </View>
      <Text style={styles.prompt} numberOfLines={2}>
        {promptText}
      </Text>
      <View style={styles.cardMeta}>
        <Text style={styles.metaText}>📅 {formatDate(item.createdAt)}</Text>
        <Text style={styles.metaText}>📝 {item.wordCount} từ</Text>
      </View>
    </TouchableOpacity>
  );
}

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

  useEffect(() => {
    load({ refresh: true, nextPage: 1 });
  }, [load]);

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

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 48 }}>📡</Text>
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

  if (essays.length === 0) {
    const isTeacher = user?.role === "teacher";
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 48 }}>✍️</Text>
        <Text style={[Typography.heading3, { marginTop: Spacing.md }]}>Chưa có bài luận</Text>
        <Text style={[Typography.body, { color: Colors.textSecondary, textAlign: "center", marginTop: Spacing.sm }]}>
          {isTeacher
            ? "Bài luận của học sinh sẽ xuất hiện ở đây sau khi họ nộp bài."
            : "Nộp bài luận đầu tiên để xem kết quả tại đây"}
        </Text>
        {!isTeacher && (
          <TouchableOpacity style={styles.retryBtn} onPress={() => router.push("/essay/input")}>
            <Text style={styles.retryText}>Viết bài</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const totalLabel = total ?? essays.length;

  const handleLoadMore = () => {
    if (loading || refreshing || loadingMore || !hasMore) return;
    load({ nextPage: page + 1 });
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={essays}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <EssayCard
            item={item}
            onPress={() => router.push({ pathname: "/essay/detail", params: { essayId: item._id } })}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load({ refresh: true, nextPage: 1 })} tintColor={Colors.primary} />
        }
        ListHeaderComponent={<Text style={styles.listHeader}>{totalLabel} bài</Text>}
        onEndReached={handleLoadMore}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: Spacing.xl },
  list: { padding: Spacing.lg, paddingBottom: 32 },
  listHeader: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
    fontWeight: "700",
    textTransform: "uppercase",
  },
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
  prompt: { ...Typography.body, lineHeight: 22, color: Colors.textSecondary, marginBottom: Spacing.sm },
  cardMeta: { flexDirection: "row", gap: Spacing.md },
  metaText: { ...Typography.bodySmall },
  retryBtn: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.xxxl,
    paddingVertical: 14,
  },
  retryText: { ...Typography.body, color: Colors.surface, fontWeight: "700" },
});



