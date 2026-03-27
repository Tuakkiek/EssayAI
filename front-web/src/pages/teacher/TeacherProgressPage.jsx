import { useMemo } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { BarChart3, BookOpenCheck, Clock3, School, Users } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import { getErrorMessage } from "@/api/client";
import * as teacherApi from "@/api/teacher";
import usePageTitle from "@/hooks/usePageTitle";

const toData = (response) => {
  const root = response?.data ?? {};
  return root?.data ?? root;
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const extractDashboard = (response) => {
  const data = toData(response);

  return {
    classes: toNumber(data?.classes),
    assignments: toNumber(data?.assignments),
    submissions: toNumber(data?.submissions),
    pendingReviews: toNumber(data?.pendingReviews),
  };
};

const extractClasses = (response) => {
  const data = toData(response);

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.classes)) {
    return data.classes;
  }

  return [];
};

const extractAnalytics = (response) => {
  const data = toData(response);
  const stats = data?.stats ?? data ?? {};

  return {
    classId: stats?.classId ?? "",
    className: stats?.className ?? "Untitled class",
    totalStudents: toNumber(stats?.totalStudents),
    totalSubmissions: toNumber(stats?.totalSubmissions),
    averageScore: toNumber(stats?.averageScore),
    submissionRate: toNumber(stats?.submissionRate),
    scoreDistribution: Array.isArray(stats?.scoreDistribution)
      ? stats.scoreDistribution.map((item) => ({
          band: String(item?.band ?? ""),
          count: toNumber(item?.count),
        }))
      : [],
    topStudents: Array.isArray(stats?.topStudents)
      ? stats.topStudents.map((student) => ({
          name: student?.name || "Unknown student",
          averageScore: toNumber(student?.averageScore),
        }))
      : [],
    recentSubmissions: Array.isArray(stats?.recentSubmissions)
      ? stats.recentSubmissions.map((submission) => ({
          studentName: submission?.studentName || "Unknown student",
          score: toNumber(submission?.score),
          createdAt: submission?.createdAt ?? "",
        }))
      : [],
  };
};

const getClassId = (cls) => cls?._id ?? cls?.id ?? "";

const formatShortDate = (value) => {
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

const getAverageBadgeClass = (score) => {
  if (score >= 7) return "bg-green-100 text-green-700";
  if (score >= 5) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
};

function TeacherProgressSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-16 animate-pulse rounded-[22px] bg-gray-200" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="h-24 animate-pulse rounded-[22px] bg-gray-200" />
          <div className="h-24 animate-pulse rounded-[22px] bg-gray-200" />
          <div className="h-24 animate-pulse rounded-[22px] bg-gray-200" />
          <div className="h-24 animate-pulse rounded-[22px] bg-gray-200" />
        </div>
        <div className="space-y-3">
          <div className="h-80 animate-pulse rounded-[22px] bg-gray-200" />
          <div className="h-80 animate-pulse rounded-[22px] bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

function TeacherProgressPage() {
  usePageTitle("Teacher Progress");
  const {
    data: dashboard,
    isLoading: isDashboardLoading,
    isError: isDashboardError,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useQuery({
    queryKey: ["teacher-dashboard-summary"],
    queryFn: teacherApi.getDashboard,
    select: extractDashboard,
  });

  const {
    data: classes = [],
    isLoading: isClassesLoading,
    isError: isClassesError,
    error: classesError,
    refetch: refetchClasses,
  } = useQuery({
    queryKey: ["teacher-classes-all"],
    queryFn: () => teacherApi.getClasses({ limit: 100 }),
    select: extractClasses,
  });

  const classAnalyticsQueries = useQueries({
    queries: classes.map((cls) => {
      const classId = getClassId(cls);
      return {
        queryKey: ["teacher-class-analytics", classId],
        queryFn: () => teacherApi.getClassAnalytics(classId),
        select: extractAnalytics,
        enabled: Boolean(classId),
      };
    }),
  });

  const analytics = useMemo(
    () => classAnalyticsQueries.map((query) => query.data).filter(Boolean),
    [classAnalyticsQueries],
  );

  const hasAnalyticsError = classAnalyticsQueries.some((query) => query.isError);
  const isAnalyticsLoading = classAnalyticsQueries.some((query) => query.isLoading);

  const firstAnalyticsError =
    classAnalyticsQueries.find((query) => query.error)?.error ?? null;

  const isLoading = isDashboardLoading || isClassesLoading || isAnalyticsLoading;
  const isError = isDashboardError || isClassesError || hasAnalyticsError;
  const error = dashboardError ?? classesError ?? firstAnalyticsError;

  const totalStudents = useMemo(
    () => analytics.reduce((sum, item) => sum + toNumber(item?.totalStudents), 0),
    [analytics],
  );

  const summary = {
    classes: dashboard?.classes ?? classes.length,
    students: totalStudents,
    submissions: dashboard?.submissions ?? 0,
    pendingReviews: dashboard?.pendingReviews ?? 0,
  };

  const retryAll = () => {
    void refetchDashboard();
    void refetchClasses();
    classAnalyticsQueries.forEach((query) => {
      void query.refetch();
    });
  };

  if (isLoading) {
    return <TeacherProgressSkeleton />;
  }

  if (isError) {
    return (
      <Card className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Unable to load class analytics</h2>
        <p className="text-sm text-gray-600" role="alert">
          {getErrorMessage(error)}
        </p>
        <Button onClick={retryAll}>Retry</Button>
      </Card>
    );
  }

  if (classes.length === 0) {
    return (
      <EmptyState
        icon={<School className="h-10 w-10" />}
        title="No classes yet"
        body="Create your first class to start tracking progress and analytics."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Class Progress"
        subtitle="Monitor teaching performance and class-level writing outcomes."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="space-y-1">
              <p className="inline-flex items-center gap-2 text-sm text-gray-500">
                <School className="h-4 w-4" />
                Classes
              </p>
              <p className="text-3xl font-black text-primary">{summary.classes}</p>
            </Card>

            <Card className="space-y-1">
              <p className="inline-flex items-center gap-2 text-sm text-gray-500">
                <Users className="h-4 w-4" />
                Students
              </p>
              <p className="text-3xl font-black text-primary">{summary.students}</p>
            </Card>

            <Card className="space-y-1">
              <p className="inline-flex items-center gap-2 text-sm text-gray-500">
                <BookOpenCheck className="h-4 w-4" />
                Submissions
              </p>
              <p className="text-3xl font-black text-primary">{summary.submissions}</p>
            </Card>

            <Card className="space-y-1">
              <p className="inline-flex items-center gap-2 text-sm text-gray-500">
                <Clock3 className="h-4 w-4" />
                Pending Reviews
              </p>
              <p className="text-3xl font-black text-primary">{summary.pendingReviews}</p>
            </Card>
          </div>
        </div>

        <div className="space-y-4">
          {analytics.map((item, index) => {
            const distribution = Array.isArray(item?.scoreDistribution)
              ? item.scoreDistribution
              : [];
            const topStudents = Array.isArray(item?.topStudents) ? item.topStudents.slice(0, 3) : [];
            const recentSubmissions = Array.isArray(item?.recentSubmissions)
              ? item.recentSubmissions.slice(0, 3)
              : [];
            const maxDistributionCount = Math.max(1, ...distribution.map((d) => toNumber(d?.count)));
            const averageScore = toNumber(item?.averageScore);

            return (
              <Card key={item?.classId || `class-analytics-${index}`} className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-lg font-bold text-gray-900">
                      {item?.className || `Class ${index + 1}`}
                    </p>
                    <p className="text-sm text-gray-500">
                      {toNumber(item?.totalStudents)} students • {toNumber(item?.totalSubmissions)} submissions
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getAverageBadgeClass(
                      averageScore,
                    )}`}
                  >
                    Avg {averageScore.toFixed(1)}
                  </span>
                </div>

                <p className="text-sm font-medium text-gray-700">
                  Submission rate: <span className="text-primary">{toNumber(item?.submissionRate)}% nộp bài</span>
                </p>

                <div className="space-y-2 rounded-2xl border border-gray-100 bg-gray-50 p-3">
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Score distribution
                  </p>
                  {distribution.length === 0 ? (
                    <p className="text-sm text-gray-500">No scored submissions yet.</p>
                  ) : (
                    distribution.map((row) => (
                      <div key={row.band} className="flex items-center gap-3">
                        <span className="w-12 shrink-0 text-xs font-semibold text-gray-500">{row.band}</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-500"
                            style={{
                              width: `${(toNumber(row.count) / maxDistributionCount) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="w-6 shrink-0 text-right text-xs font-semibold text-gray-700">
                          {toNumber(row.count)}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-700">Top students</p>
                    {topStudents.length === 0 ? (
                      <p className="text-sm text-gray-500">No ranking data yet.</p>
                    ) : (
                      topStudents.map((student) => (
                        <div
                          key={`${item?.classId}-${student.name}`}
                          className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-3 py-2"
                        >
                          <p className="truncate text-sm font-medium text-gray-800">{student.name}</p>
                          <p className={`text-sm font-bold ${getScoreColor(student.averageScore)}`}>
                            {student.averageScore.toFixed(1)}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-700">Recent submissions</p>
                    {recentSubmissions.length === 0 ? (
                      <p className="text-sm text-gray-500">No recent submissions.</p>
                    ) : (
                      recentSubmissions.map((submission, submissionIndex) => (
                        <div
                          key={`${item?.classId}-recent-${submission.studentName}-${submissionIndex}`}
                          className="rounded-xl border border-gray-100 bg-white px-3 py-2"
                        >
                          <p className="truncate text-sm font-medium text-gray-800">{submission.studentName}</p>
                          <p className="text-xs text-gray-500">
                            {formatShortDate(submission.createdAt)} •{" "}
                            <span className={`font-semibold ${getScoreColor(submission.score)}`}>
                              {submission.score.toFixed(1)}
                            </span>
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default TeacherProgressPage;
