import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3, BookOpen, Plus, Trash2, Users } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import * as teacherApi from "@/api/teacher";
import { getErrorMessage } from "@/api/client";
import PageHeader from "@/components/layout/PageHeader";
import BulkCreateModal from "@/components/teacher/BulkCreateModal";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge from "@/components/ui/StatusBadge";
import * as toast from "@/utils/toast";
import usePageTitle from "@/hooks/usePageTitle";

const TABS = {
  students: "students",
  assignments: "assignments",
  analytics: "analytics",
};

const ASSIGNMENT_FILTERS = ["all", "draft", "published", "closed"];

const toData = (response) => {
  const root = response?.data ?? {};
  return root?.data ?? root;
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const extractClassDetail = (response) => {
  const data = toData(response);
  const cls = data?.class ?? data?.cls ?? data ?? {};
  const students = Array.isArray(data?.students) ? data.students : [];

  return {
    classInfo: cls,
    students,
  };
};

const extractAssignments = (response) => {
  const data = toData(response);

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.assignments)) {
    return data.assignments;
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
      ? stats.topStudents.map((item) => ({
          name: item?.name || "Unknown student",
          averageScore: toNumber(item?.averageScore),
        }))
      : [],
    recentSubmissions: Array.isArray(stats?.recentSubmissions)
      ? stats.recentSubmissions.map((item) => ({
          studentName: item?.studentName || "Unknown student",
          score: toNumber(item?.score),
          createdAt: item?.createdAt ?? "",
        }))
      : [],
  };
};

const getAssignmentId = (item) => item?._id ?? item?.id ?? "";

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const getScoreClass = (score) => {
  if (score >= 7) return "text-green-600";
  if (score >= 5) return "text-amber-600";
  return "text-red-500";
};

const getTabClass = (isActive) =>
  [
    "rounded-full px-4 py-2 text-sm font-semibold transition",
    isActive ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200",
  ].join(" ");

function ClassDetailPage() {
  usePageTitle("Class Detail");
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(TABS.students);
  const [assignmentFilter, setAssignmentFilter] = useState("all");
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  const {
    data: classDetail,
    isLoading: isClassLoading,
    isError: isClassError,
    error: classError,
    refetch: refetchClassDetail,
  } = useQuery({
    queryKey: ["teacher-class-detail", id],
    queryFn: () => teacherApi.getClassById(id),
    select: extractClassDetail,
    enabled: Boolean(id),
  });

  const {
    data: assignments = [],
    isLoading: isAssignmentsLoading,
    isError: isAssignmentsError,
    error: assignmentsError,
    refetch: refetchAssignments,
  } = useQuery({
    queryKey: ["teacher-class-assignments", id],
    queryFn: () => teacherApi.getAssignments({ classId: id, limit: 200 }),
    select: extractAssignments,
    enabled: Boolean(id),
  });

  const {
    data: analytics,
    isLoading: isAnalyticsLoading,
    isError: isAnalyticsError,
    error: analyticsError,
    refetch: refetchAnalytics,
  } = useQuery({
    queryKey: ["teacher-class-analytics", id],
    queryFn: () => teacherApi.getClassAnalytics(id),
    select: extractAnalytics,
    enabled: Boolean(id),
  });

  const removeStudentMutation = useMutation({
    mutationFn: (studentId) => teacherApi.removeStudent(id, studentId),
    onSuccess: () => {
      toast.success("Student removed from class.");
      void refetchClassDetail();
      void refetchAnalytics();
      void queryClient.invalidateQueries({ queryKey: ["teacher-classes-grid"] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const classInfo = classDetail?.classInfo ?? {};
  const students = classDetail?.students ?? [];

  const filteredAssignments = useMemo(() => {
    if (assignmentFilter === "all") {
      return assignments;
    }

    return assignments.filter((assignment) => assignment?.status === assignmentFilter);
  }, [assignmentFilter, assignments]);

  const distribution = analytics?.scoreDistribution ?? [];
  const maxDistributionCount = Math.max(1, ...distribution.map((item) => toNumber(item?.count)));
  const topStudents = Array.isArray(analytics?.topStudents) ? analytics.topStudents.slice(0, 3) : [];
  const recentSubmissions = Array.isArray(analytics?.recentSubmissions)
    ? analytics.recentSubmissions.slice(0, 5)
    : [];

  const isLoading = isClassLoading || !id;
  const isError = isClassError;

  const handleRetryAll = () => {
    void refetchClassDetail();
    void refetchAssignments();
    void refetchAnalytics();
  };

  const handleRemoveStudent = (student) => {
    const studentId = student?._id ?? student?.id ?? "";

    if (!studentId) {
      return;
    }

    const shouldRemove = window.confirm(
      `Remove "${student?.name || "this student"}" from the class?`,
    );
    if (!shouldRemove) {
      return;
    }

    removeStudentMutation.mutate(studentId);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-24 animate-pulse rounded-[22px] bg-gray-200" />
        <div className="h-64 animate-pulse rounded-[22px] bg-gray-200" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Cannot load class details</h2>
        <p className="text-sm text-gray-600">{getErrorMessage(classError)}</p>
        <Button onClick={handleRetryAll}>Retry</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={classInfo?.name || "Class detail"}
        subtitle={`Code: ${classInfo?.code || "N/A"}${
          classInfo?.description ? ` - ${classInfo.description}` : ""
        }`}
        backHref="/teacher/classes"
        actions={
          activeTab === TABS.students ? (
            <Button
              icon={<Plus className="h-4 w-4" />}
              onClick={() => setIsBulkModalOpen(true)}
            >
              Them hoc sinh
            </Button>
          ) : activeTab === TABS.assignments ? (
            <Button
              icon={<Plus className="h-4 w-4" />}
              onClick={() =>
                navigate(`/teacher/assignments/create?classId=${encodeURIComponent(id)}`)
              }
            >
              Tao bai tap
            </Button>
          ) : null
        }
      />

      <Card className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={getTabClass(activeTab === TABS.students)}
            onClick={() => setActiveTab(TABS.students)}
          >
            Students
          </button>
          <button
            type="button"
            className={getTabClass(activeTab === TABS.assignments)}
            onClick={() => setActiveTab(TABS.assignments)}
          >
            Assignments
          </button>
          <button
            type="button"
            className={getTabClass(activeTab === TABS.analytics)}
            onClick={() => setActiveTab(TABS.analytics)}
          >
            Analytics
          </button>
        </div>

        {activeTab === TABS.students ? (
          students.length === 0 ? (
            <EmptyState
              icon={<Users className="h-10 w-10" />}
              title="No students yet"
              body="Add students in bulk to start this class."
              action={{
                label: "Them hoc sinh",
                onClick: () => setIsBulkModalOpen(true),
              }}
            />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-gray-100">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-600">
                  <tr>
                    <th className="px-3 py-2 font-semibold">STT</th>
                    <th className="px-3 py-2 font-semibold">Name</th>
                    <th className="px-3 py-2 font-semibold">Phone</th>
                    <th className="px-3 py-2 font-semibold">Avg Score</th>
                    <th className="px-3 py-2 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, index) => {
                    const avgScore = toNumber(student?.stats?.averageScore);
                    return (
                      <tr key={student?._id || student?.id || index} className="border-t border-gray-100">
                        <td className="px-3 py-2 text-gray-700">{index + 1}</td>
                        <td className="px-3 py-2 font-medium text-gray-800">{student?.name || "-"}</td>
                        <td className="px-3 py-2 text-gray-700">{student?.phone || "-"}</td>
                        <td className={`px-3 py-2 font-semibold ${getScoreClass(avgScore)}`}>
                          {avgScore.toFixed(1)}
                        </td>
                        <td className="px-3 py-2">
                          <Button
                            variant="danger"
                            size="sm"
                            icon={<Trash2 className="h-4 w-4" />}
                            onClick={() => handleRemoveStudent(student)}
                            loading={
                              removeStudentMutation.isPending &&
                              removeStudentMutation.variables ===
                                (student?._id ?? student?.id)
                            }
                          >
                            Remove
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : null}

        {activeTab === TABS.assignments ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {ASSIGNMENT_FILTERS.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className={getTabClass(assignmentFilter === filter)}
                  onClick={() => setAssignmentFilter(filter)}
                >
                  {filter === "all"
                    ? "All"
                    : filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>

            {isAssignmentsLoading ? (
              <div className="space-y-2">
                <div className="h-20 animate-pulse rounded-2xl bg-gray-200" />
                <div className="h-20 animate-pulse rounded-2xl bg-gray-200" />
              </div>
            ) : isAssignmentsError ? (
              <Card className="space-y-3" variant="error">
                <p className="text-sm font-semibold text-red-700">Cannot load assignments.</p>
                <p className="text-sm text-red-600">{getErrorMessage(assignmentsError)}</p>
                <Button variant="secondary" onClick={() => refetchAssignments()}>
                  Retry
                </Button>
              </Card>
            ) : filteredAssignments.length === 0 ? (
              <EmptyState
                icon={<BookOpen className="h-10 w-10" />}
                title="No assignments in this class"
                body="Create a new assignment for this class."
                action={{
                  label: "Tao bai tap",
                  onClick: () =>
                    navigate(`/teacher/assignments/create?classId=${encodeURIComponent(id)}`),
                }}
              />
            ) : (
              <div className="space-y-3">
                {filteredAssignments.map((assignment, index) => {
                  const assignmentId = getAssignmentId(assignment);
                  return (
                    <button
                      key={assignmentId || `assignment-${index}`}
                      type="button"
                      onClick={() =>
                        navigate(`/teacher/assignments/${encodeURIComponent(assignmentId)}`)
                      }
                      className="w-full rounded-2xl border border-gray-100 bg-white p-4 text-left transition hover:bg-gray-50"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-gray-900">
                          {assignment?.title || "Untitled assignment"}
                        </p>
                        <StatusBadge status={assignment?.status || "draft"} />
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        Due: {formatDate(assignment?.dueDate)}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}

        {activeTab === TABS.analytics ? (
          <div className="space-y-4">
            {isAnalyticsLoading ? (
              <div className="space-y-2">
                <div className="h-24 animate-pulse rounded-2xl bg-gray-200" />
                <div className="h-24 animate-pulse rounded-2xl bg-gray-200" />
                <div className="h-24 animate-pulse rounded-2xl bg-gray-200" />
              </div>
            ) : isAnalyticsError ? (
              <Card className="space-y-3" variant="error">
                <p className="text-sm font-semibold text-red-700">Cannot load analytics.</p>
                <p className="text-sm text-red-600">{getErrorMessage(analyticsError)}</p>
                <Button variant="secondary" onClick={() => refetchAnalytics()}>
                  Retry
                </Button>
              </Card>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Card className="space-y-1">
                    <p className="text-sm text-gray-500">Students</p>
                    <p className="text-2xl font-black text-gray-900">
                      {toNumber(analytics?.totalStudents)}
                    </p>
                  </Card>
                  <Card className="space-y-1">
                    <p className="text-sm text-gray-500">Submissions</p>
                    <p className="text-2xl font-black text-primary">
                      {toNumber(analytics?.totalSubmissions)}
                    </p>
                  </Card>
                  <Card className="space-y-1">
                    <p className="text-sm text-gray-500">Avg score</p>
                    <p className={`text-2xl font-black ${getScoreClass(toNumber(analytics?.averageScore))}`}>
                      {toNumber(analytics?.averageScore).toFixed(1)}
                    </p>
                  </Card>
                </div>

                <Card className="space-y-3">
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Score distribution
                  </p>
                  {distribution.length === 0 ? (
                    <p className="text-sm text-gray-500">No scored essays yet.</p>
                  ) : (
                    distribution.map((row) => (
                      <div key={row.band} className="flex items-center gap-3">
                        <span className="w-12 text-xs font-semibold text-gray-600">{row.band}</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-500"
                            style={{
                              width: `${(toNumber(row.count) / maxDistributionCount) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="w-8 text-right text-xs font-semibold text-gray-700">
                          {toNumber(row.count)}
                        </span>
                      </div>
                    ))
                  )}
                </Card>

                <div className="grid gap-3 md:grid-cols-2">
                  <Card className="space-y-2">
                    <p className="text-sm font-semibold text-gray-700">Top students</p>
                    {topStudents.length === 0 ? (
                      <p className="text-sm text-gray-500">No ranking data yet.</p>
                    ) : (
                      topStudents.map((student) => (
                        <div
                          key={`top-${student.name}`}
                          className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-3 py-2"
                        >
                          <p className="truncate text-sm font-medium text-gray-800">{student.name}</p>
                          <p className={`text-sm font-bold ${getScoreClass(student.averageScore)}`}>
                            {student.averageScore.toFixed(1)}
                          </p>
                        </div>
                      ))
                    )}
                  </Card>

                  <Card className="space-y-2">
                    <p className="text-sm font-semibold text-gray-700">Recent submissions</p>
                    {recentSubmissions.length === 0 ? (
                      <p className="text-sm text-gray-500">No recent submissions.</p>
                    ) : (
                      recentSubmissions.map((submission, index) => (
                        <div
                          key={`recent-${submission.studentName}-${index}`}
                          className="rounded-xl border border-gray-100 bg-white px-3 py-2"
                        >
                          <p className="truncate text-sm font-medium text-gray-800">
                            {submission.studentName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(submission.createdAt)} |{" "}
                            <span className={`font-semibold ${getScoreClass(submission.score)}`}>
                              {submission.score.toFixed(1)}
                            </span>
                          </p>
                        </div>
                      ))
                    )}
                  </Card>
                </div>
              </>
            )}
          </div>
        ) : null}
      </Card>

      {isBulkModalOpen ? (
        <BulkCreateModal
          open={isBulkModalOpen}
          classId={id}
          onClose={() => setIsBulkModalOpen(false)}
          onSuccess={() => {
            void refetchClassDetail();
            void refetchAnalytics();
            void queryClient.invalidateQueries({ queryKey: ["teacher-classes-grid"] });
          }}
        />
      ) : null}
    </div>
  );
}

export default ClassDetailPage;
