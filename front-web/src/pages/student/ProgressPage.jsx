import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Flame, Trophy, Target, TrendingUp, BarChart3 } from "lucide-react";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/layout/PageHeader";
import * as improvementApi from "@/api/improvement";
import { getErrorMessage } from "@/api/client";
import usePageTitle from "@/hooks/usePageTitle";

const CRITERIA_ORDER = [
  "Task Achievement",
  "Coherence & Cohesion",
  "Lexical Resource",
  "Grammatical Range",
];

const parseProgressResponse = (response) => {
  const root = response?.data ?? {};
  const data = root?.data ?? root;

  return {
    timeline: Array.isArray(data?.timeline) ? data.timeline : [],
    improvement: data?.improvement ?? {
      firstScore: 0,
      latestScore: 0,
      delta: 0,
      trend: "stable",
      streakDays: 0,
    },
    criteriaProgress: Array.isArray(data?.criteriaProgress) ? data.criteriaProgress : [],
    weakestCriteria: data?.weakestCriteria ?? "",
    strongestCriteria: data?.strongestCriteria ?? "",
    totalEssays: Number(data?.totalEssays ?? 0),
    scoredEssays: Number(data?.scoredEssays ?? 0),
    averageScore: Number(data?.averageScore ?? 0),
    personalBest: Number(data?.personalBest ?? 0),
  };
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
  }).format(date);
};

const getScoreColor = (score) => {
  if (score >= 7) return "text-green-600";
  if (score >= 5) return "text-amber-600";
  return "text-red-500";
};

const getBarColor = (score) => {
  if (score >= 7) return "bg-green-500";
  if (score >= 5) return "bg-amber-500";
  return "bg-red-500";
};

const getTrendBadge = (trend, delta) => {
  if (trend === "improving") {
    return {
      label: `📈 +${Math.abs(delta).toFixed(1)}`,
      className: "bg-green-100 text-green-700",
    };
  }
  if (trend === "declining") {
    return {
      label: `📉 -${Math.abs(delta).toFixed(1)}`,
      className: "bg-red-100 text-red-700",
    };
  }
  return {
    label: "➡️ Stable",
    className: "bg-amber-100 text-amber-700",
  };
};

const resolveCriteriaRows = (criteriaProgress) => {
  const map = new Map(
    criteriaProgress.map((item) => [String(item.criterion || "").trim(), item]),
  );

  return CRITERIA_ORDER.map((criterion) => {
    const item = map.get(criterion);
    return {
      criterion,
      first: Number(item?.first ?? 0),
      latest: Number(item?.latest ?? 0),
      delta: Number(item?.delta ?? 0),
      hasData: item != null,
    };
  });
};

function ProgressPage() {
  usePageTitle("Progress");
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["student-progress"],
    queryFn: improvementApi.getProgress,
    select: parseProgressResponse,
  });

  const timeline = data?.timeline ?? [];
  const improvement = data?.improvement ?? {};
  const criteriaRows = useMemo(
    () => resolveCriteriaRows(data?.criteriaProgress ?? []),
    [data?.criteriaProgress],
  );

  const trendBadge = useMemo(
    () => getTrendBadge(improvement.trend, improvement.delta),
    [improvement.delta, improvement.trend],
  );

  const firstDate = timeline.length > 0 ? formatDate(timeline[0]?.date) : "-";
  const lastDate = timeline.length > 0 ? formatDate(timeline[timeline.length - 1]?.date) : "-";

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-28 animate-pulse rounded-[22px] bg-gray-200" />
        <div className="h-28 animate-pulse rounded-[22px] bg-gray-200" />
        <div className="h-44 animate-pulse rounded-[22px] bg-gray-200" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Unable to load progress</h2>
        <p className="text-sm text-gray-600" role="alert">
          {getErrorMessage(error)}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-[18px] bg-primary px-4 py-2 text-sm font-semibold text-white"
        >
          Retry
        </button>
      </Card>
    );
  }

  if (timeline.length === 0) {
    return (
      <EmptyState
        icon={<BarChart3 className="h-10 w-10" />}
        title="No progress data yet"
        body="Submit your first essay to start tracking progress."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Your Progress" subtitle="See how your writing is improving over time." />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="space-y-1">
          <p className="text-sm text-gray-500">Average score</p>
          <p className={`text-2xl font-black ${getScoreColor(data.averageScore)}`}>
            {data.averageScore.toFixed(1)}
          </p>
        </Card>
        <Card className="space-y-1">
          <p className="text-sm text-gray-500">Personal best</p>
          <p className={`text-2xl font-black ${getScoreColor(data.personalBest)}`}>
            {data.personalBest.toFixed(1)}
          </p>
        </Card>
        <Card className="space-y-1">
          <p className="text-sm text-gray-500">Total essays</p>
          <p className="text-2xl font-black text-gray-900">{data.totalEssays}</p>
        </Card>
        <Card className="space-y-1">
          <p className="text-sm text-gray-500">Streak days</p>
          <p className="inline-flex items-center gap-1 text-2xl font-black text-orange-500">
            <Flame className="h-6 w-6" />
            {improvement.streakDays ?? 0}
          </p>
        </Card>
      </div>

      <Card className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-gray-900">Overall trend</h2>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${trendBadge.className}`}>
            {trendBadge.label}
          </span>
        </div>
        <p className="text-sm text-gray-600">
          From {Number(improvement.firstScore ?? 0).toFixed(1)} to{" "}
          {Number(improvement.latestScore ?? 0).toFixed(1)}
        </p>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Score timeline</h2>
        <div className="overflow-x-auto">
          <div className="inline-flex min-h-[220px] min-w-full items-end gap-2 rounded-2xl border border-gray-100 bg-gray-50 p-4">
            {timeline.map((item, index) => {
              const score = Number(item?.score ?? 0);
              const height = Math.max(8, (score / 9) * 160);
              return (
                <div key={`${item?.essayId || index}`} className="flex w-6 flex-col items-center gap-2">
                  <div className={`w-full rounded-t-md ${getBarColor(score)}`} style={{ height: `${height}px` }} />
                  <p className="text-[10px] font-semibold text-gray-500">{score.toFixed(1)}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs font-medium text-gray-500">
          <span>{firstDate}</span>
          <span>{timeline.length} essays</span>
          <span>{lastDate}</span>
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900">Criteria progress</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="py-2 font-semibold">Criterion</th>
                <th className="py-2 font-semibold">First</th>
                <th className="py-2 font-semibold">Latest</th>
                <th className="py-2 font-semibold">Delta</th>
              </tr>
            </thead>
            <tbody>
              {criteriaRows.map((row) => (
                <tr key={row.criterion} className="border-b border-gray-50 last:border-b-0">
                  <td className="py-2 font-medium text-gray-800">{row.criterion}</td>
                  <td className="py-2 text-gray-600">{row.hasData ? row.first.toFixed(1) : "-"}</td>
                  <td className="py-2 text-gray-600">{row.hasData ? row.latest.toFixed(1) : "-"}</td>
                  <td className={`py-2 font-semibold ${row.delta >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {row.hasData ? `${row.delta >= 0 ? "+" : ""}${row.delta.toFixed(1)}` : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="space-y-2">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500">
            <Trophy className="h-4 w-4 text-amber-500" />
            Strongest
          </p>
          <p className="text-base font-bold text-gray-900">{data.strongestCriteria || "-"}</p>
        </Card>
        <Card className="space-y-2">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500">
            <Target className="h-4 w-4 text-red-500" />
            Weakest
          </p>
          <p className="text-base font-bold text-gray-900">{data.weakestCriteria || "-"}</p>
        </Card>
      </div>
    </div>
  );
}

export default ProgressPage;
