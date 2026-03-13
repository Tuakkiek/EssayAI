import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from "react-native";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart2,
  Trophy,
  Target,
  Users,
  FileText,
  Star,
  Flame,
  Wifi,
  Medal,
} from "lucide-react-native";
import { Colors, Spacing, Typography, Radius, Shadow } from "@/constants/theme";
import { getBandColor } from "@/utils/bandColor";
import { classApi, improvementApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { ClassAnalytics } from "../types";

const { width: SCREEN_W } = Dimensions.get("window");
const CHART_W = SCREEN_W - Spacing.lg * 2 - Spacing.xl * 2;

interface ProgressData {
  timeline: {
    date: string;
    score: number;
    taskType: string;
    essayId: string;
  }[];
  improvement: {
    firstScore: number;
    latestScore: number;
    delta: number;
    trend: string;
    streakDays: number;
  };
  criteriaProgress: {
    criterion: string;
    first: number;
    latest: number;
    delta: number;
  }[];
  weakestCriteria: string;
  strongestCriteria: string;
  totalEssays: number;
  scoredEssays: number;
  averageScore: number;
  personalBest: number;
}

// ─── Trend Badge ───────────────────────────────────────────────────────────────
function TrendBadge({ trend, delta }: { trend: string; delta: number }) {
  const cfg =
    trend === "improving"
      ? {
          Icon: TrendingUp,
          color: Colors.success,
          bg: Colors.successLight,
          label: `+${delta} Tiến bộ`,
        }
      : trend === "declining"
        ? {
            Icon: TrendingDown,
            color: Colors.error,
            bg: Colors.errorLight,
            label: `${delta} Giảm`,
          }
        : {
            Icon: Minus,
            color: Colors.warning,
            bg: Colors.warningLight,
            label: "Ổn định",
          };

  return (
    <View style={[sharedStyles.trendBadge, { backgroundColor: cfg.bg }]}>
      <cfg.Icon size={15} color={cfg.color} strokeWidth={2.2} />
      <Text style={[sharedStyles.trendLabel, { color: cfg.color }]}>
        {cfg.label}
      </Text>
    </View>
  );
}

// ─── Score Chart ───────────────────────────────────────────────────────────────
function ScoreChart({ timeline }: { timeline: ProgressData["timeline"] }) {
  if (timeline.length < 2) return null;
  const scores = timeline.map((t) => t.score);
  const minScore = Math.min(...scores) - 0.5;
  const maxScore = Math.max(...scores) + 0.5;
  const range = maxScore - minScore || 1;
  const barW = Math.max(
    8,
    (CHART_W - (timeline.length - 1) * 4) / timeline.length,
  );

  return (
    <View>
      <Text style={sharedStyles.sectionTitle}>Lịch sử điểm</Text>
      <View style={styles.chartArea}>
        <View style={styles.yAxis}>
          {[9, 7, 5, 3].map((v) => (
            <Text key={v} style={styles.yLabel}>
              {v}
            </Text>
          ))}
        </View>
        <View style={styles.barsArea}>
          {timeline.map((t, i) => {
            const heightPct = ((t.score - minScore) / range) * 100;
            const color = getBandColor(t.score);
            return (
              <View key={i} style={[styles.barCol, { width: barW }]}>
                <Text style={[styles.barScore, { color }]}>{t.score}</Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        height: `${Math.max(10, heightPct)}%` as any,
                        backgroundColor: color,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </View>
      <View style={styles.xAxis}>
        <Text style={styles.xLabel}>
          {new Date(timeline[0].date).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
          })}
        </Text>
        <Text style={styles.xLabel}>{timeline.length} bài</Text>
        <Text style={styles.xLabel}>
          {new Date(timeline[timeline.length - 1].date).toLocaleDateString(
            "en-GB",
            { day: "numeric", month: "short" },
          )}
        </Text>
      </View>
    </View>
  );
}

// ─── Student Progress View ─────────────────────────────────────────────────────
function StudentProgressView() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    try {
      const { data: res } = await improvementApi.getProgress();
      if (!res?.success && res?.message) throw new Error(res.message);
      setData(res?.data || res);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải tiến độ");
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
      <View style={sharedStyles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={sharedStyles.center}>
        <View style={styles.emptyIconWrap}>
          <Wifi size={32} color={Colors.textMuted} strokeWidth={1.5} />
        </View>
        <Text style={[Typography.heading3, { marginTop: Spacing.md }]}>
          Không thể tải
        </Text>
        <Text
          style={[
            Typography.body,
            {
              color: Colors.textSecondary,
              marginTop: Spacing.sm,
              textAlign: "center",
            },
          ]}
        >
          {error}
        </Text>
        <TouchableOpacity
          style={sharedStyles.retryBtn}
          onPress={() => {
            setLoading(true);
            load();
          }}
        >
          <Text style={sharedStyles.retryText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!data || data.scoredEssays === 0) {
    return (
      <View style={sharedStyles.center}>
        <View style={styles.emptyIconWrap}>
          <Target size={36} color={Colors.primary} strokeWidth={1.5} />
        </View>
        <Text
          style={[
            Typography.heading2,
            { marginTop: Spacing.lg, textAlign: "center" },
          ]}
        >
          Chưa có tiến độ
        </Text>
        <Text
          style={[
            Typography.body,
            {
              color: Colors.textSecondary,
              marginTop: Spacing.sm,
              textAlign: "center",
            },
          ]}
        >
          Hãy nộp và chấm bài đầu tiên để bắt đầu theo dõi tiến độ
        </Text>
      </View>
    );
  }

  const imp = data.improvement;

  return (
    <ScrollView
      contentContainerStyle={sharedStyles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => load(true)}
          tintColor={Colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Stats row */}
      <View style={sharedStyles.statsRow}>
        <View style={sharedStyles.statBox}>
          <Text
            style={[
              sharedStyles.statVal,
              { color: getBandColor(data.averageScore) },
            ]}
          >
            {data.averageScore.toFixed(1)}
          </Text>
          <Text style={sharedStyles.statLbl}>Điểm TB</Text>
        </View>
        <View style={sharedStyles.statBox}>
          <Text
            style={[
              sharedStyles.statVal,
              { color: getBandColor(data.personalBest) },
            ]}
          >
            {data.personalBest.toFixed(1)}
          </Text>
          <Text style={sharedStyles.statLbl}>Cao nhất</Text>
        </View>
        <View style={sharedStyles.statBox}>
          <Text style={[sharedStyles.statVal, { color: Colors.primary }]}>
            {data.totalEssays}
          </Text>
          <Text style={sharedStyles.statLbl}>Tổng bài</Text>
        </View>
        {imp.streakDays > 0 && (
          <View style={sharedStyles.statBox}>
            <View style={styles.streakWrap}>
              <Text style={[sharedStyles.statVal, { color: Colors.warning }]}>
                {imp.streakDays}
              </Text>
              <Flame
                size={14}
                color={Colors.warning}
                strokeWidth={2}
                style={{ marginBottom: 2 }}
              />
            </View>
            <Text style={sharedStyles.statLbl}>Chuỗi ngày</Text>
          </View>
        )}
      </View>

      {/* Trend card */}
      <View style={sharedStyles.card}>
        <View style={styles.trendRow}>
          <View>
            <Text style={sharedStyles.sectionTitle}>Xu hướng tổng thể</Text>
            <Text style={Typography.bodySmall}>
              Từ {imp.firstScore.toFixed(1)} → {imp.latestScore.toFixed(1)}
            </Text>
          </View>
          <TrendBadge trend={imp.trend} delta={imp.delta} />
        </View>
      </View>

      {/* Chart */}
      {data.timeline.length > 1 && (
        <View style={sharedStyles.card}>
          <ScoreChart timeline={data.timeline} />
        </View>
      )}

      {/* Criteria */}
      {data.criteriaProgress.length > 0 && (
        <View style={sharedStyles.card}>
          <Text style={sharedStyles.sectionTitle}>Phân tích tiêu chí</Text>
          {data.criteriaProgress.map((c) => (
            <View key={c.criterion} style={styles.criteriaRow}>
              <View style={styles.criteriaInfo}>
                <Text style={styles.criteriaName}>{c.criterion}</Text>
                <Text style={styles.criteriaRange}>
                  {c.first.toFixed(1)} → {c.latest.toFixed(1)}
                </Text>
              </View>
              <Text
                style={[
                  styles.deltaText,
                  { color: c.delta >= 0 ? Colors.success : Colors.error },
                ]}
              >
                {c.delta >= 0 ? "+" : ""}
                {c.delta.toFixed(1)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Insights */}
      {(data.weakestCriteria || data.strongestCriteria) && (
        <View style={styles.insightsRow}>
          {data.strongestCriteria ? (
            <View style={[styles.insightBox, { borderColor: Colors.success }]}>
              <View
                style={[styles.insightIconWrap, { backgroundColor: "#D1FAE5" }]}
              >
                <Trophy size={18} color={Colors.success} strokeWidth={1.8} />
              </View>
              <Text style={styles.insightLabel}>Điểm mạnh</Text>
              <Text style={[styles.insightValue, { color: Colors.success }]}>
                {data.strongestCriteria}
              </Text>
            </View>
          ) : null}
          {data.weakestCriteria ? (
            <View style={[styles.insightBox, { borderColor: Colors.warning }]}>
              <View
                style={[styles.insightIconWrap, { backgroundColor: "#FEF3C7" }]}
              >
                <Target size={18} color={Colors.warning} strokeWidth={1.8} />
              </View>
              <Text style={styles.insightLabel}>Cần cải thiện</Text>
              <Text style={[styles.insightValue, { color: Colors.warning }]}>
                {data.weakestCriteria}
              </Text>
            </View>
          ) : null}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── Teacher Progress View ─────────────────────────────────────────────────────
function TeacherProgressView() {
  const [analytics, setAnalytics] = useState<ClassAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    try {
      const clsRes = await classApi.getAll();
      const classes = clsRes.data?.data?.classes ?? clsRes.data?.data ?? [];
      const analyticsResults: ClassAnalytics[] = await Promise.all(
        classes.map(async (cls: { _id: string }) => {
          try {
            const res = await classApi.getAnalytics(cls._id);
            return res.data?.data?.stats ?? res.data?.data ?? null;
          } catch {
            return null;
          }
        }),
      );
      setAnalytics(analyticsResults.filter(Boolean));
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể tải thống kê lớp",
      );
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
      <View style={sharedStyles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={sharedStyles.center}>
        <View style={styles.emptyIconWrap}>
          <Wifi size={32} color={Colors.textMuted} strokeWidth={1.5} />
        </View>
        <Text style={[Typography.heading3, { marginTop: Spacing.md }]}>
          Không thể tải
        </Text>
        <Text
          style={[
            Typography.body,
            {
              color: Colors.textSecondary,
              marginTop: Spacing.sm,
              textAlign: "center",
            },
          ]}
        >
          {error}
        </Text>
        <TouchableOpacity
          style={sharedStyles.retryBtn}
          onPress={() => {
            setLoading(true);
            load();
          }}
        >
          <Text style={sharedStyles.retryText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (analytics.length === 0) {
    return (
      <View style={sharedStyles.center}>
        <View style={styles.emptyIconWrap}>
          <Users size={36} color={Colors.primary} strokeWidth={1.5} />
        </View>
        <Text
          style={[
            Typography.heading2,
            { marginTop: Spacing.lg, textAlign: "center" },
          ]}
        >
          Chưa có dữ liệu
        </Text>
        <Text
          style={[
            Typography.body,
            {
              color: Colors.textSecondary,
              marginTop: Spacing.sm,
              textAlign: "center",
            },
          ]}
        >
          Tạo lớp và mời học sinh để theo dõi tiến độ lớp học tại đây.
        </Text>
      </View>
    );
  }

  const totalStudents = analytics.reduce(
    (s, a) => s + (a.totalStudents ?? 0),
    0,
  );
  const totalSubmissions = analytics.reduce(
    (s, a) => s + (a.totalSubmissions ?? 0),
    0,
  );
  const avgScore = analytics.length
    ? analytics.reduce((s, a) => s + (a.averageScore ?? 0), 0) /
      analytics.length
    : 0;

  return (
    <ScrollView
      contentContainerStyle={sharedStyles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => load(true)}
          tintColor={Colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Summary stats */}
      <View style={sharedStyles.statsRow}>
        <View style={sharedStyles.statBox}>
          <Text style={[sharedStyles.statVal, { color: Colors.primary }]}>
            {analytics.length}
          </Text>
          <Text style={sharedStyles.statLbl}>Lớp học</Text>
        </View>
        <View style={sharedStyles.statBox}>
          <Text style={[sharedStyles.statVal, { color: Colors.primary }]}>
            {totalStudents}
          </Text>
          <Text style={sharedStyles.statLbl}>Học sinh</Text>
        </View>
        <View style={sharedStyles.statBox}>
          <Text
            style={[sharedStyles.statVal, { color: getBandColor(avgScore) }]}
          >
            {avgScore.toFixed(1)}
          </Text>
          <Text style={sharedStyles.statLbl}>Điểm TB</Text>
        </View>
        <View style={sharedStyles.statBox}>
          <Text style={[sharedStyles.statVal, { color: Colors.primary }]}>
            {totalSubmissions}
          </Text>
          <Text style={sharedStyles.statLbl}>Bài nộp</Text>
        </View>
      </View>

      {analytics.map((a, idx) => (
        <View key={a.classId ?? idx} style={sharedStyles.card}>
          <Text style={sharedStyles.sectionTitle}>
            {a.className ?? `Lớp ${idx + 1}`}
          </Text>

          {/* Class meta */}
          <View style={styles.classMetaRow}>
            <View style={styles.classMetaItem}>
              <Users size={13} color={Colors.textSecondary} strokeWidth={2} />
              <Text style={styles.classMeta}>{a.totalStudents} học sinh</Text>
            </View>
            <View style={styles.classMetaItem}>
              <FileText
                size={13}
                color={Colors.textSecondary}
                strokeWidth={2}
              />
              <Text style={styles.classMeta}>{a.totalSubmissions} bài nộp</Text>
            </View>
            <View style={styles.classMetaItem}>
              <Star
                size={13}
                color={getBandColor(a.averageScore)}
                strokeWidth={2}
              />
              <Text
                style={[
                  styles.classMeta,
                  { color: getBandColor(a.averageScore) },
                ]}
              >
                TB {a.averageScore?.toFixed(1) ?? "—"}
              </Text>
            </View>
            <View style={styles.classMetaItem}>
              <BarChart2
                size={13}
                color={Colors.textSecondary}
                strokeWidth={2}
              />
              <Text style={styles.classMeta}>
                {a.submissionRate ?? 0}% nộp bài
              </Text>
            </View>
          </View>

          {/* Score distribution */}
          {a.scoreDistribution?.length > 0 && (
            <View style={styles.distBox}>
              <Text style={styles.distTitle}>Phân phối điểm</Text>
              {a.scoreDistribution.map((d) => {
                const maxCount = Math.max(
                  ...a.scoreDistribution.map((x) => x.count),
                  1,
                );
                return (
                  <View key={d.band} style={styles.distRow}>
                    <Text style={styles.distLabel}>{d.band}</Text>
                    <View style={styles.distBarBg}>
                      <View
                        style={[
                          styles.distBarFill,
                          { width: `${(d.count / maxCount) * 100}%` as any },
                        ]}
                      />
                    </View>
                    <Text style={styles.distCount}>{d.count}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Top students */}
          {a.topStudents?.length > 0 && (
            <View style={{ marginTop: Spacing.md }}>
              <Text style={styles.distTitle}>Top học sinh</Text>
              {a.topStudents.slice(0, 3).map((s, i) => {
                const medalColors = ["#F59E0B", "#94A3B8", "#CD7C54"];
                return (
                  <View key={i} style={styles.topStudentRow}>
                    <Medal size={18} color={medalColors[i]} strokeWidth={1.8} />
                    <Text style={styles.topStudentName}>{s.name}</Text>
                    <Text
                      style={[
                        styles.topStudentScore,
                        { color: getBandColor(s.averageScore) },
                      ]}
                    >
                      {s.averageScore.toFixed(1)}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      ))}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── Progress Screen ───────────────────────────────────────────────────────────
export default function ProgressScreen() {
  const { user, isLoading } = useAuth();
  const isTeacher = user?.role === "teacher";
  const isStudent =
    user?.role === "center_student" || user?.role === "free_student";

  if (isLoading || (!isTeacher && !isStudent)) {
    return (
      <View style={sharedStyles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={sharedStyles.container}>
      <View style={sharedStyles.header}>
        <Text style={sharedStyles.headerTitle}>
          {isTeacher ? "Tiến độ lớp học" : "Tiến độ của tôi"}
        </Text>
        <Text style={sharedStyles.headerSub}>
          {isTeacher ? "Tổng hợp tất cả lớp" : (user?.name ?? "")}
        </Text>
      </View>
      {isTeacher ? <TeacherProgressView /> : <StudentProgressView />}
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const sharedStyles = StyleSheet.create({
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
  },
  headerTitle: {
    ...Typography.heading2,
    color: Colors.surface,
    fontWeight: "800",
  },
  headerSub: {
    ...Typography.bodySmall,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  content: { padding: Spacing.lg },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  sectionTitle: { ...Typography.heading3, marginBottom: Spacing.md },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    flexWrap: "wrap",
  },
  statBox: {
    flex: 1,
    minWidth: 70,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: "center",
    ...Shadow.sm,
  },
  statVal: { fontSize: 22, fontWeight: "800", marginBottom: 2 },
  statLbl: { ...Typography.caption, textAlign: "center" },
  retryBtn: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  retryText: { ...Typography.body, color: Colors.surface, fontWeight: "700" },
  trendBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  trendLabel: { fontWeight: "700", fontSize: 13 },
});

const styles = StyleSheet.create({
  // Empty / error states
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
  },

  // Streak
  streakWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2,
  },

  // Trend
  trendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  // Chart
  chartArea: { flexDirection: "row", height: 140, marginBottom: Spacing.xs },
  yAxis: { width: 28, justifyContent: "space-between", paddingVertical: 16 },
  yLabel: { ...Typography.caption, textAlign: "right" },
  barsArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
    paddingBottom: 16,
  },
  barCol: { flex: 0, alignItems: "center", height: "100%" },
  barScore: { ...Typography.caption, marginBottom: 2, fontWeight: "700" },
  barTrack: {
    flex: 1,
    width: "100%",
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 3,
    justifyContent: "flex-end",
  },
  barFill: { borderRadius: 3, width: "100%" },
  xAxis: { flexDirection: "row", justifyContent: "space-between" },
  xLabel: { ...Typography.caption, color: Colors.textMuted },

  // Criteria
  criteriaRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  criteriaInfo: { flex: 1 },
  criteriaName: { ...Typography.body, fontWeight: "600" },
  criteriaRange: { ...Typography.bodySmall },
  deltaText: { fontSize: 15, fontWeight: "700" },

  // Insights
  insightsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  insightBox: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: "center",
    borderWidth: 1.5,
    ...Shadow.sm,
  },
  insightIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  insightLabel: { ...Typography.caption, marginBottom: 4 },
  insightValue: {
    ...Typography.bodySmall,
    fontWeight: "700",
    textAlign: "center",
  },

  // Class meta
  classMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  classMetaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  classMeta: { ...Typography.bodySmall, color: Colors.textSecondary },

  // Distribution
  distBox: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  distTitle: {
    ...Typography.caption,
    fontWeight: "700",
    marginBottom: Spacing.sm,
  },
  distRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  distLabel: { width: 36, ...Typography.caption },
  distBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: "hidden",
  },
  distBarFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  distCount: { width: 28, textAlign: "right", ...Typography.caption },

  // Top students
  topStudentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    gap: Spacing.sm,
  },
  topStudentName: { flex: 1, ...Typography.body },
  topStudentScore: { ...Typography.body, fontWeight: "800" },
});
