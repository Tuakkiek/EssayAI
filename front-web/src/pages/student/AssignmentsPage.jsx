import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, BookOpen, CalendarDays, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/layout/PageHeader";
import * as studentApi from "@/api/student";
import { getErrorMessage } from "@/api/client";
import usePageTitle from "@/hooks/usePageTitle";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "submitted", label: "Submitted" },
  { key: "expired", label: "Expired" },
];

const extractAssignments = (response) => {
  const root = response?.data ?? {};
  const data = root?.data ?? root;
  if (Array.isArray(data?.assignments)) return data.assignments;
  if (Array.isArray(data)) return data;
  return [];
};

const getAssignmentId = (assignment) => assignment?._id ?? assignment?.id ?? "";

const getDueTime = (assignment) => {
  const date = new Date(assignment?.dueDate ?? "");
  return Number.isNaN(date.getTime()) ? Number.POSITIVE_INFINITY : date.getTime();
};

const isSubmitted = (assignment) =>
  Boolean(
    assignment?.mySubmission ||
      assignment?.submission ||
      assignment?.status === "submitted" ||
      assignment?.status === "graded" ||
      assignment?.status === "scored",
  );

const getScore = (assignment) => {
  const raw = assignment?.mySubmission?.overallScore ?? assignment?.mySubmission?.score ?? assignment?.score;
  const numeric = Number(raw);
  return Number.isFinite(numeric) ? numeric : null;
};

const getStatusKey = (assignment, currentTime) => {
  if (isSubmitted(assignment)) return "submitted";
  if (getDueTime(assignment) < currentTime) return "expired";
  return "pending";
};

const STATUS_CONFIG = {
  submitted: {
    label: "Đã nộp",
    className: "bg-green-100 text-green-700",
  },
  expired: {
    label: "Hết hạn",
    className: "bg-red-100 text-red-700",
  },
  pending: {
    label: "Chưa nộp",
    className: "bg-amber-100 text-amber-700",
  },
};

const formatDate = (value) => {
  if (!value) return "No deadline";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No deadline";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

function AssignmentsPage() {
  usePageTitle("Assignments");
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [currentTime, setCurrentTime] = useState(12 * 60 * 60 * 1000);

  const { data: assignments = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ["student-assignments"],
    queryFn: studentApi.getAssignments,
    select: extractAssignments,
  });

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setCurrentTime(Date.now());
    }, 0);
    const intervalId = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 60 * 1000);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, []);

  const decoratedAssignments = useMemo(
    () =>
      assignments.map((assignment) => {
        const statusKey = getStatusKey(assignment, currentTime);
        const dueTime = getDueTime(assignment);
        const hoursRemaining = Math.round((dueTime - currentTime) / (60 * 60 * 1000));
        return {
          raw: assignment,
          id: getAssignmentId(assignment),
          title: assignment?.title || "Untitled assignment",
          teacherName: assignment?.teacherId?.name || assignment?.teacherName || "Teacher",
          dueDate: formatDate(assignment?.dueDate),
          statusKey,
          score: getScore(assignment),
          dueSoon: statusKey === "pending" && hoursRemaining > 0 && hoursRemaining < 24,
        };
      }),
    [assignments, currentTime],
  );

  const filteredAssignments = useMemo(() => {
    if (selectedFilter === "all") return decoratedAssignments;
    return decoratedAssignments.filter((assignment) => assignment.statusKey === selectedFilter);
  }, [decoratedAssignments, selectedFilter]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-28 animate-pulse rounded-[22px] bg-gray-200" />
        <div className="h-28 animate-pulse rounded-[22px] bg-gray-200" />
        <div className="h-28 animate-pulse rounded-[22px] bg-gray-200" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Không thể tải bài tập</h2>
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

  return (
    <div className="space-y-5">
      <PageHeader title="Bài tập" subtitle={`${assignments.length} bài tập`} />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <button
            key={filter.key}
            type="button"
            onClick={() => setSelectedFilter(filter.key)}
            className={[
              "rounded-full px-4 py-2 text-sm font-semibold transition",
              selectedFilter === filter.key
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200",
            ].join(" ")}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {filteredAssignments.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-10 w-10" />}
          title="Không có bài tập"
          body="Bài tập phù hợp với bộ lọc hiện tại sẽ xuất hiện ở đây."
        />
      ) : (
        <div className="space-y-3">
          {filteredAssignments.map((assignment) => {
            const statusConfig = STATUS_CONFIG[assignment.statusKey];
            return (
              <button
                key={assignment.id}
                type="button"
                onClick={() => {
                  if (!assignment.id) return;
                  navigate(`/student/assignments/${assignment.id}`);
                }}
                className="w-full rounded-[22px] border border-gray-100 bg-white p-4 text-left shadow-sm transition hover:bg-gray-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-100">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-bold text-gray-900">{assignment.title}</p>
                      <p className="mt-1 inline-flex items-center gap-1 text-xs text-gray-500">
                        <User className="h-3.5 w-3.5" />
                        {assignment.teacherName}
                      </p>
                      <p className="mt-1 inline-flex items-center gap-1 text-xs text-gray-500">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {assignment.dueDate}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusConfig.className}`}>
                      {statusConfig.label}
                    </span>
                    {assignment.score != null ? (
                      <span className="rounded-full border border-primary/20 bg-primaryLight px-3 py-1 text-xs font-bold text-primaryDark">
                        Band {assignment.score.toFixed(1)}
                      </span>
                    ) : null}
                  </div>
                </div>

                {assignment.dueSoon ? (
                  <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Sắp hết hạn dưới 24h
                  </p>
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AssignmentsPage;
