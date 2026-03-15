/**
 * HistoryScreen — Essay history with motivating layout.
 * Spec: minimal, encouraging, score as badge, single action per card.
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { PenLine, Wifi, Clock, FileText } from "lucide-react-native";
import { Colors, Radius, Shadow, Spacing, Typography } from "../constants/theme";
import { AppButton } from "../components/AppButton";
import { essayApi, getErrorMessage } from "../services/api";
import { HistoryItem } from "../types";
import { formatDate } from "../utils/bandColor";
import { useAuth } from "../context/AuthContext";

const PAGE_SIZE = 20;

// ── Status config with encouraging labels ─────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; emoji: string }> = {
  scored:  { label: "Graded",     color: Colors.primary,   bg: Colors.primaryLight, emoji: "✅" },
  graded:  { label: "Graded",     color: Colors.primary,   bg: Colors.primaryLight, emoji: "✅" },
  grading: { label: "Grading...", color: Colors.warning,   bg: Colors.warningLight, emoji: "⏳" },
  pending: { label: "Pending",    color: Colors.textMuted, bg: Colors.surfaceAlt,   emoji: "⏳" },
  error:   { label: "Try again",  color: Colors.errorSoft, bg: Colors.errorLight,   emoji: "🔄" },
};

function getBandColor(score: number): string {
  if (score >= 7) return Colors.primary;
  if (score >= 5) return Colors.warning;
  return Colors.errorSoft;
}

// ── Single Essay Card ─────────────────────────────────────────────────────────
function EssayCard({
  item,
  onPress,
  index,
}: {
  item: HistoryItem;
  onPress: () => void;
  index: number;
}) {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(16)).current;

  React.useEffect(() => {
    const delay = Math.min(index * 60, 300);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, delay, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 300, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  const normStatus = item.status === "grading" ? "grading" : item.status;
  const statusCfg = STATUS_CONFIG[normStatus] ?? STATUS_CONFIG.pending;
  const displayScore = item.score ?? item.overallScore ?? item.overallBand;

  const preview =
    item.textPreview ??
    item.text?.slice(0, 120) ??
    item.originalText?.slice(0, 120) ??
    (typeof item.assignmentId === "object" ? item.assignmentId?.title : null) ??
    "IELTS Writing Essay";

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <TouchableOpacity
        style={[styles.card, Shadow.sm]}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <View style={styles.cardTop}>
          {/* Status badge */}
          <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
            <Text style={styles.statusEmoji}>{statusCfg.emoji}</Text>
            <Text style={[styles.statusLabel, { color: statusCfg.color }]}>
              {statusCfg.label}
            </Text>
          </View>

          {/* Score — prominent */}
          {displayScore != null ? (
            <View
              style={[
                styles.scoreBadge,
                { borderColor: getBandColor(displayScore) + "40" },
              ]}
            >
              <Text
                style={[
                  styles.scoreText,
                  { color: getBandColor(displayScore) },
                ]}
              >
                {displayScore.toFixed(1)}
              </Text>
            </View>
          ) : (
            <View style={styles.taskChip}>
              <Text style={styles.taskText}>Essay</Text>
            </View>
          )}
        </View>

        {/* Preview text */}
        <Text style={styles.preview} numberOfLines={2}>
          {preview}
        </Text>

        {/* Meta row */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Clock size={11} color={Colors.textMuted} strokeWidth={2} />
            <Text style={styles.metaText}>{formatDate(item.createdAt)}</Text>
          </View>
          <View style={styles.metaItem}>
            <FileText size={11} color={Colors.textMuted} strokeWidth={2} />
            <Text style={styles.metaText}>{item.wordCount} words</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── History Screen ─────────────────────────────────────────────────────────────
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

  const load = useCallback(
    async (opts?: { refresh?: boolean; nextPage?: number }) => {
      const isRefresh = opts?.refresh ?? false;
      const nextPage = opts?.nextPage ?? 1;

      if (isRefresh) setRefreshing(true);
      else if (nextPage === 1) setLoading(true);
      else setLoadingMore(true);

      try {
        const res = await essayApi.getHistory({ page: nextPage, limit: PAGE_SIZE });
        const payload = res.data?.data;
        const list = payload?.essays ?? payload ?? [];
        const pagination = payload?.pagination ?? null;

        setEssays((prev) => (nextPage === 1 ? list : [...prev, ...list]));
        setPage(pagination?.page ?? nextPage);
        setHasMore((pagination?.page ?? nextPage) < (pagination?.pages ?? 1));
        setTotal(pagination?.total ?? null);
        setError(null);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  useEffect(() => {
    load();
  }, [load]);

  const getEssayId = (item: HistoryItem) => {
    const id = item._id;
    if (typeof id === "string") return id;
    if (id && typeof id === "object") {
      const obj = id as { $oid?: string; toString?: () => string };
      if (obj.$oid) return obj.$oid;
    }
    return null;
  };

  // ── Loading ──
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading your essays...</Text>
      </View>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <View style={styles.center}>
        <View style={styles.iconCircle}>
          <Wifi size={28} color={Colors.textMuted} strokeWidth={1.5} />
        </View>
        <Text style={styles.emptyTitle}>Can't connect</Text>
        <Text style={styles.emptyBody}>{error}</Text>
        <AppButton
          label="Try Again"
          onPress={() => load()}
          style={{ marginTop: Spacing.lg, paddingHorizontal: Spacing.xl }}
          fullWidth={false}
        />
      </View>
    );
  }

  // ── Empty ──
  if (essays.length === 0) {
    return (
      <View style={styles.center}>
        <View style={styles.iconCircle}>
          <PenLine size={28} color={Colors.primary} strokeWidth={1.5} />
        </View>
        <Text style={styles.emptyTitle}>No essays yet!</Text>
        <Text style={styles.emptyBody}>
          Write your first essay and see your AI-graded results here.
        </Text>
        <AppButton
          label="Write an Essay"
          onPress={() => router.push("/essay/input" as any)}
          style={{ marginTop: Spacing.lg }}
          fullWidth={false}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={essays}
        keyExtractor={(item, i) => getEssayId(item) ?? String(i)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load({ refresh: true })}
            tintColor={Colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.totalLabel}>
              {total ?? essays.length} essays
            </Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const id = getEssayId(item);
          return (
            <EssayCard
              item={item}
              index={index}
              onPress={() => {
                if (!id) return;
                router.push({ pathname: "/essay/detail", params: { essayId: id } });
              }}
            />
          );
        }}
        onEndReached={() => {
          if (!loading && !refreshing && !loadingMore && hasMore) {
            load({ nextPage: page + 1 });
          }
        }}
        onEndReachedThreshold={0.6}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footer}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : null
        }
      />
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
    gap: Spacing.sm,
  },

  // Loading / error / empty
  loadingText: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
    ...Shadow.sm,
  },
  emptyTitle: {
    ...Typography.title2,
    textAlign: "center",
  },
  emptyBody: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 260,
  },

  // List
  list: {
    padding: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.sm,
  },
  listHeader: {
    paddingVertical: Spacing.xs,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  totalLabel: {
    ...Typography.label,
    color: Colors.textMuted,
  },

  // Card
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  statusEmoji: { fontSize: 11 },
  statusLabel: {
    ...Typography.caption,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  scoreBadge: {
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    minWidth: 48,
    alignItems: "center",
  },
  scoreText: {
    ...Typography.title3,
    fontWeight: "800",
  },
  taskChip: {
    backgroundColor: Colors.background,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  taskText: {
    ...Typography.caption,
    fontWeight: "700",
    color: Colors.textMuted,
  },
  preview: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  footer: {
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
});
