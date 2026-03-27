import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Clock3, FileText, History } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import { getErrorMessage } from "@/api/client";
import * as studentApi from "@/api/student";
import { useAuth } from "@/context/AuthContext";
import usePageTitle from "@/hooks/usePageTitle";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const extractAssignments = (response) => {
  const root = response?.data ?? {};
  const data = root?.data ?? root;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.assignments)) {
    return data.assignments;
  }

  if (Array.isArray(root?.assignments)) {
    return root.assignments;
  }

  return [];
};

const getAssignmentId = (assignment) => assignment?._id ?? assignment?.id ?? "";

const toTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return Number.POSITIVE_INFINITY;
  }
  return date.getTime();
};

const isSubmitted = (assignment) =>
  Boolean(
    assignment?.mySubmission ||
      assignment?.submission ||
      assignment?.status === "submitted" ||
      assignment?.status === "graded" ||
      assignment?.status === "scored",
  );

const getScore = (assignment) =>
  assignment?.mySubmission?.overallScore ??
  assignment?.overallScore ??
  assignment?.score ??
  null;

const getStatusLabel = (assignment, currentTime) => {
  if (isSubmitted(assignment)) {
    return "Submitted";
  }

  const dueTime = toTime(assignment?.dueDate);
  if (dueTime < currentTime) {
    return "Expired";
  }

  return "Pending";
};

const getStatusClassName = (label) => {
  if (label === "Submitted") {
    return "bg-green-100 text-green-700";
  }

  if (label === "Expired") {
    return "bg-red-100 text-red-700";
  }

  return "bg-amber-100 text-amber-700";
};

const formatDate = (value) => {
  if (!value) {
    return "No deadline";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "No deadline";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const getGreetingByHour = (hour) => {
  if (hour < 12) {
    return "Good morning";
  }
  if (hour < 18) {
    return "Good afternoon";
  }
  return "Good evening";
};

function StudentHomePage() {
  usePageTitle("Student Home");
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(12 * 60 * 60 * 1000);

  const {
    data: assignments = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["student-assignments-home"],
    queryFn: studentApi.getAssignments,
    select: extractAssignments,
  });

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        setCurrentTime(Date.now());
      }
      if (document.visibilityState === "visible") {
        void refetch();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refetch]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setCurrentTime(Date.now());
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  const greeting = useMemo(() => {
    const hour = new Date(currentTime || 12 * 60 * 60 * 1000).getHours();
    return `${getGreetingByHour(hour)}, ${user?.name || "Student"}`;
  }, [currentTime, user?.name]);

  const analytics = useMemo(() => {
    const pending = assignments.filter((item) => !isSubmitted(item));
    const now = currentTime;
    const dueSoon = pending.filter((item) => {
      const dueTime = toTime(item?.dueDate);
      return dueTime >= now && dueTime - now <= ONE_DAY_MS;
    });
    const done = assignments.filter((item) => isSubmitted(item));

    return {
      pendingCount: pending.length,
      dueSoonCount: dueSoon.length,
      doneCount: done.length,
    };
  }, [assignments, currentTime]);

  const nextAssignment = useMemo(() => {
    return assignments
      .filter((item) => !isSubmitted(item))
      .sort((a, b) => toTime(a?.dueDate) - toTime(b?.dueDate))[0];
  }, [assignments]);

  const topAssignments = useMemo(() => {
    return [...assignments]
      .sort((a, b) => toTime(a?.dueDate) - toTime(b?.dueDate))
      .slice(0, 4);
  }, [assignments]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-36 animate-pulse rounded-[22px] bg-gray-200" />
        <div className="h-28 animate-pulse rounded-[22px] bg-gray-200" />
        <div className="h-40 animate-pulse rounded-[22px] bg-gray-200" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Cannot load dashboard</h2>
        <p className="text-sm text-gray-600" role="alert">
          {getErrorMessage(error)}
        </p>
        <Button onClick={() => refetch()}>Retry</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={greeting} subtitle="Your writing journey starts here." />

      <Card className="space-y-4">
        {nextAssignment ? (
          <>
            <div className="inline-flex items-center rounded-full bg-primaryLight px-3 py-1 text-xs font-semibold text-primaryDark">
              Next assignment
            </div>
            <h2 className="text-xl font-bold text-gray-900">{nextAssignment.title || "Untitled assignment"}</h2>
            <p className="text-sm text-gray-600">
              Due: <span className="font-semibold">{formatDate(nextAssignment.dueDate)}</span>
            </p>
            <Button
              onClick={() =>
                navigate(
                  `/student/essay/write?assignmentId=${encodeURIComponent(getAssignmentId(nextAssignment))}`,
                )
              }
              icon={<ArrowRight className="h-4 w-4" />}
            >
              Do assignment
            </Button>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold text-gray-900">No pending assignment</h2>
            <p className="text-sm text-gray-600">Write a free essay and get instant AI feedback.</p>
            <Button onClick={() => navigate("/student/essay/write")} icon={<FileText className="h-4 w-4" />}>
              Write an essay
            </Button>
          </>
        )}
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="space-y-1">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-black text-gray-900">{analytics.pendingCount}</p>
        </Card>
        <Card className="space-y-1">
          <p className="text-sm text-gray-500">Due soon</p>
          <p className="text-2xl font-black text-amber-600">{analytics.dueSoonCount}</p>
        </Card>
        <Card className="space-y-1">
          <p className="text-sm text-gray-500">Done</p>
          <p className="text-2xl font-black text-primary">{analytics.doneCount}</p>
        </Card>
      </div>

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Assignments</h3>
          {assignments.length > 4 ? (
            <Link to="/student/assignments" className="text-sm font-semibold text-primary hover:text-primaryDark">
              View all
            </Link>
          ) : null}
        </div>

        {topAssignments.length === 0 ? (
          <EmptyState
            title="No assignments yet"
            body="Your upcoming tasks will appear here."
            action={{
              label: "Write an essay",
              onClick: () => navigate("/student/essay/write"),
            }}
          />
        ) : (
          <div className="space-y-3">
            {topAssignments.map((assignment, index) => {
              const score = getScore(assignment);
              const statusLabel = getStatusLabel(assignment, currentTime);
              const assignmentId = getAssignmentId(assignment);
              return (
                <button
                  key={assignmentId || `assignment-${index}`}
                  type="button"
                  onClick={() => {
                    if (!assignmentId) {
                      return;
                    }
                    navigate(`/student/assignments/${assignmentId}`);
                  }}
                  className="w-full rounded-2xl border border-gray-100 bg-white p-4 text-left transition hover:bg-gray-50"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-900">{assignment.title || "Untitled assignment"}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        <Clock3 className="mr-1 inline h-3.5 w-3.5" />
                        {formatDate(assignment.dueDate)}
                      </p>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClassName(
                        statusLabel,
                      )}`}
                    >
                      {statusLabel}
                    </span>
                  </div>
                  {score != null ? (
                    <p className="mt-2 text-sm font-semibold text-primary">Band {Number(score).toFixed(1)}</p>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}
      </Card>

      <Card className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-base font-bold text-gray-900">Need inspiration?</p>
          <p className="text-sm text-gray-500">Review your previous submissions and score trends.</p>
        </div>
        <Button
          variant="secondary"
          onClick={() => navigate("/student/history")}
          icon={<History className="h-4 w-4" />}
        >
          View history
        </Button>
      </Card>
    </div>
  );
}

export default StudentHomePage;
