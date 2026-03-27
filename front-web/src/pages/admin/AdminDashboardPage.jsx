import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Building2, DollarSign, FileText, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import * as adminApi from "@/api/admin";
import { getErrorMessage } from "@/api/client";
import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import usePageTitle from "@/hooks/usePageTitle";

const toData = (response) => {
  const root = response?.data ?? {};
  return root?.data ?? root;
};

const extractOverview = (response) => {
  const data = toData(response);
  const centers = data?.centers ?? {};
  const users = data?.users ?? {};
  const essays = data?.essays ?? {};
  const revenue = data?.revenue ?? {};

  return {
    totalUsers: Number(users?.total ?? 0),
    totalEssays: Number(essays?.total ?? 0),
    revenueVnd: Number(revenue?.totalVnd ?? 0),
    activeCenters: Number(centers?.active ?? 0),
    planBreakdown: Array.isArray(data?.planBreakdown) ? data.planBreakdown : [],
  };
};

const extractUserAnalytics = (response) => {
  const data = toData(response);
  return {
    newUsers: Array.isArray(data?.newUsers) ? data.newUsers : [],
  };
};

const extractEssayAnalytics = (response) => {
  const data = toData(response);
  return {
    scoreDistribution: Array.isArray(data?.scoreDistribution) ? data.scoreDistribution : [],
    taskTypeBreakdown: Array.isArray(data?.taskTypeBreakdown) ? data.taskTypeBreakdown : [],
  };
};

const SCORE_BUCKETS = [0, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.1];

const buildScoreLabel = (lowerBound) => {
  if (lowerBound === "other") return "Other";
  const index = SCORE_BUCKETS.findIndex((value) => value === Number(lowerBound));
  const next = SCORE_BUCKETS[index + 1];
  if (next) {
    return `${Number(lowerBound).toFixed(1)}-${Number(next).toFixed(1)}`;
  }
  return String(lowerBound);
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

const formatNumber = (value) => new Intl.NumberFormat("en-GB").format(Number(value || 0));

const getPlanLabel = (plan) => {
  const key = String(plan || "free").toLowerCase();
  if (key.includes("enterprise")) return "Enterprise";
  if (key.includes("pro")) return "Pro";
  if (key.includes("starter")) return "Starter";
  if (key.includes("free")) return "Free";
  return key.toUpperCase();
};

const getPlanColor = (plan) => {
  const key = String(plan || "").toLowerCase();
  if (key.includes("enterprise")) return "bg-purple-100 text-purple-700";
  if (key.includes("pro")) return "bg-green-100 text-green-700";
  if (key.includes("starter")) return "bg-blue-100 text-blue-700";
  return "bg-gray-100 text-gray-700";
};

function AdminDashboardPage() {
  usePageTitle("Admin Dashboard");
  const navigate = useNavigate();

  const {
    data: overview,
    isLoading: isOverviewLoading,
    isError: isOverviewError,
    error: overviewError,
    refetch: refetchOverview,
  } = useQuery({
    queryKey: ["admin-analytics-overview"],
    queryFn: adminApi.getAnalyticsOverview,
    select: extractOverview,
  });

  const {
    data: userAnalytics,
    isLoading: isUsersLoading,
    isError: isUsersError,
    error: usersError,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ["admin-analytics-users"],
    queryFn: adminApi.getAnalyticsUsers,
    select: extractUserAnalytics,
  });

  const {
    data: essayAnalytics,
    isLoading: isEssaysLoading,
    isError: isEssaysError,
    error: essaysError,
    refetch: refetchEssays,
  } = useQuery({
    queryKey: ["admin-analytics-essays"],
    queryFn: adminApi.getAnalyticsEssays,
    select: extractEssayAnalytics,
  });

  const isLoading = isOverviewLoading || isUsersLoading || isEssaysLoading;
  const isError = isOverviewError || isUsersError || isEssaysError;
  const error = overviewError ?? usersError ?? essaysError;

  const userSeries = useMemo(() => userAnalytics?.newUsers ?? [], [userAnalytics?.newUsers]);
  const scoreDistribution = useMemo(
    () => essayAnalytics?.scoreDistribution ?? [],
    [essayAnalytics?.scoreDistribution],
  );

  const maxUserCount = useMemo(() => {
    const counts = userSeries.map((item) => Number(item?.count ?? 0));
    return Math.max(1, ...counts);
  }, [userSeries]);

  const maxScoreCount = useMemo(() => {
    const counts = scoreDistribution.map((item) => Number(item?.count ?? 0));
    return Math.max(1, ...counts);
  }, [scoreDistribution]);

  const planBreakdown = overview?.planBreakdown ?? [];
  const totalPlans = planBreakdown.reduce((sum, item) => sum + Number(item?.count ?? 0), 0);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-24 animate-pulse rounded-[22px] bg-gray-200" />
        <div className="h-36 animate-pulse rounded-[22px] bg-gray-200" />
        <div className="h-36 animate-pulse rounded-[22px] bg-gray-200" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Cannot load admin analytics</h2>
        <p className="text-sm text-gray-600" role="alert">
          {getErrorMessage(error)}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => refetchOverview()}>Retry overview</Button>
          <Button variant="secondary" onClick={() => refetchUsers()}>
            Retry users
          </Button>
          <Button variant="secondary" onClick={() => refetchEssays()}>
            Retry essays
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Admin Dashboard" subtitle="Platform-wide analytics overview." />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="space-y-1">
          <p className="inline-flex items-center gap-2 text-sm text-gray-500">
            <Users className="h-4 w-4" />
            Total users
          </p>
          <p className="text-2xl font-black text-gray-900">{formatNumber(overview?.totalUsers)}</p>
        </Card>
        <Card className="space-y-1">
          <p className="inline-flex items-center gap-2 text-sm text-gray-500">
            <FileText className="h-4 w-4" />
            Total essays
          </p>
          <p className="text-2xl font-black text-gray-900">{formatNumber(overview?.totalEssays)}</p>
        </Card>
        <Card className="space-y-1">
          <p className="inline-flex items-center gap-2 text-sm text-gray-500">
            <DollarSign className="h-4 w-4" />
            Revenue (VND)
          </p>
          <p className="text-2xl font-black text-gray-900">{formatNumber(overview?.revenueVnd)}</p>
        </Card>
        <Card className="space-y-1">
          <p className="inline-flex items-center gap-2 text-sm text-gray-500">
            <Building2 className="h-4 w-4" />
            Active centers
          </p>
          <p className="text-2xl font-black text-gray-900">{formatNumber(overview?.activeCenters)}</p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">User growth (30 days)</h2>
            <BarChart3 className="h-5 w-5 text-gray-500" />
          </div>
          {userSeries.length === 0 ? (
            <EmptyState title="No growth data" body="User growth data will appear here." />
          ) : (
            <div className="space-y-3">
              <div className="flex min-h-[180px] items-end gap-2 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                {userSeries.map((item) => {
                  const value = Number(item?.count ?? 0);
                  const height = Math.max(8, (value / maxUserCount) * 140);
                  return (
                    <div key={item?._id} className="flex w-4 flex-col items-center gap-2">
                      <div className="w-full rounded-t-md bg-primary" style={{ height: `${height}px` }} />
                      <span className="text-[10px] font-semibold text-gray-500">{value}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{formatDate(userSeries[0]?._id)}</span>
                <span>{userSeries.length} days</span>
                <span>{formatDate(userSeries[userSeries.length - 1]?._id)}</span>
              </div>
            </div>
          )}
        </Card>

        <Card className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Essay score distribution</h2>
          {scoreDistribution.length === 0 ? (
            <EmptyState title="No score data" body="Score distribution will appear here." />
          ) : (
            <div className="space-y-2">
              {scoreDistribution.map((item) => {
                const label = buildScoreLabel(item?._id);
                const count = Number(item?.count ?? 0);
                const width = Math.max(4, (count / maxScoreCount) * 100);
                return (
                  <div key={label} className="flex items-center gap-3 text-sm">
                    <span className="w-20 text-xs font-semibold text-gray-600">{label}</span>
                    <div className="h-2 flex-1 rounded-full bg-gray-100">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${width}%` }} />
                    </div>
                    <span className="w-10 text-right text-xs font-semibold text-gray-700">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <Card className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900">Plan breakdown</h2>
        {planBreakdown.length === 0 ? (
          <p className="text-sm text-gray-500">No plan data available.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {planBreakdown.map((plan) => {
              const count = Number(plan?.count ?? 0);
              const percent = totalPlans ? Math.round((count / totalPlans) * 100) : 0;
              const label = getPlanLabel(plan?.plan);
              return (
                <span
                  key={label}
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${getPlanColor(
                    plan?.plan,
                  )}`}
                >
                  {label}: {count} ({percent}%)
                </span>
              );
            })}
          </div>
        )}
      </Card>

      <Card className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-base font-bold text-gray-900">Quick actions</p>
          <p className="text-sm text-gray-500">Manage users and monitor platform health.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => navigate("/admin/users")}>Manage users</Button>
          <Button variant="secondary" onClick={() => navigate("/admin")}>
            View analytics
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default AdminDashboardPage;
