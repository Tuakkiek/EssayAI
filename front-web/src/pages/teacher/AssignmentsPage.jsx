import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Plus, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import * as teacherApi from "@/api/teacher";
import { getErrorMessage } from "@/api/client";
import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge from "@/components/ui/StatusBadge";
import * as toast from "@/utils/toast";
import usePageTitle from "@/hooks/usePageTitle";

const FILTERS = ["all", "draft", "published", "closed"];

const toData = (response) => {
  const root = response?.data ?? {};
  return root?.data ?? root;
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

const getAssignmentId = (assignment) => assignment?._id ?? assignment?.id ?? "";

const getClassName = (assignment) =>
  assignment?.classId?.name ?? assignment?.classId?.title ?? "Unknown class";

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

function TeacherAssignmentsPage() {
  usePageTitle("Assignments");
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");

  const {
    data: assignments = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["teacher-assignments"],
    queryFn: () => teacherApi.getAssignments({ limit: 500 }),
    select: extractAssignments,
  });

  const actionMutation = useMutation({
    mutationFn: ({ id, action }) => {
      if (action === "publish") {
        return teacherApi.publishAssignment(id);
      }
      if (action === "close") {
        return teacherApi.closeAssignment(id);
      }
      if (action === "delete") {
        return teacherApi.deleteAssignment(id);
      }
      throw new Error("Unsupported action.");
    },
    onSuccess: () => {
      toast.success("Assignment updated.");
      void refetch();
    },
    onError: (submitError) => {
      toast.error(getErrorMessage(submitError));
    },
  });

  const filteredAssignments = useMemo(() => {
    if (filter === "all") {
      return assignments;
    }
    return assignments.filter((item) => item?.status === filter);
  }, [assignments, filter]);

  const handleAction = (assignment, action) => {
    const assignmentId = getAssignmentId(assignment);
    if (!assignmentId) return;

    const labelMap = {
      publish: "publish",
      close: "close",
      delete: "delete",
    };

    const shouldProceed = window.confirm(
      `Do you want to ${labelMap[action] || "update"} this assignment?`,
    );
    if (!shouldProceed) return;

    actionMutation.mutate({ id: assignmentId, action });
  };

  const isActionBusy = (assignmentId, action) =>
    actionMutation.isPending &&
    actionMutation.variables?.id === assignmentId &&
    actionMutation.variables?.action === action;

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-24 animate-pulse rounded-[22px] bg-gray-200" />
        <div className="h-24 animate-pulse rounded-[22px] bg-gray-200" />
        <div className="h-24 animate-pulse rounded-[22px] bg-gray-200" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Cannot load assignments</h2>
        <p className="text-sm text-gray-600" role="alert">
          {getErrorMessage(error)}
        </p>
        <Button onClick={() => refetch()}>Retry</Button>
      </Card>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="space-y-5">
        <PageHeader title="Assignments" subtitle="Create assignments and manage student submissions." />
        <EmptyState
          title="No assignments yet"
          body="Create your first assignment for a class."
          action={{ label: "Create assignment", onClick: () => navigate("/teacher/assignments/create") }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assignments"
        subtitle="Track assignment status and submissions."
        actions={
          <Button
            variant="secondary"
            icon={<RefreshCw className="h-4 w-4" />}
            onClick={() => refetch()}
          >
            Refresh
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={[
              "rounded-full px-4 py-2 text-sm font-semibold transition",
              filter === item
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200",
            ].join(" ")}
          >
            {item === "all" ? "All" : item.charAt(0).toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>

      {filteredAssignments.length === 0 ? (
        <EmptyState title="No assignments in this filter" body="Try another status filter." />
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-2xl border border-gray-100 md:block">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Title</th>
                  <th className="px-4 py-3 font-semibold">Class</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Due date</th>
                  <th className="px-4 py-3 font-semibold">Submissions</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssignments.map((assignment) => {
                  const assignmentId = getAssignmentId(assignment);
                  const status = assignment?.status || "draft";
                  const submissionCount = assignment?.stats?.submissionCount ?? 0;

                  return (
                    <tr key={assignmentId} className="border-t border-gray-100">
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        {assignment?.title || "Untitled assignment"}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{getClassName(assignment)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={status} />
                      </td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(assignment?.dueDate)}</td>
                      <td className="px-4 py-3 text-gray-600">{submissionCount}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => navigate(`/teacher/assignments/${assignmentId}`)}
                          >
                            View
                          </Button>
                          {status === "draft" ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleAction(assignment, "publish")}
                                loading={isActionBusy(assignmentId, "publish")}
                              >
                                Publish
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => handleAction(assignment, "delete")}
                                loading={isActionBusy(assignmentId, "delete")}
                              >
                                Delete
                              </Button>
                            </>
                          ) : null}
                          {status === "published" ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleAction(assignment, "close")}
                              loading={isActionBusy(assignmentId, "close")}
                            >
                              Close
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {filteredAssignments.map((assignment) => {
              const assignmentId = getAssignmentId(assignment);
              const status = assignment?.status || "draft";
              return (
                <Card key={assignmentId} className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-base font-bold text-gray-900">
                        {assignment?.title || "Untitled assignment"}
                      </p>
                      <p className="text-sm text-gray-500">{getClassName(assignment)}</p>
                    </div>
                    <StatusBadge status={status} />
                  </div>
                  <p className="text-sm text-gray-600">Due: {formatDate(assignment?.dueDate)}</p>
                  <p className="text-sm text-gray-600">
                    Submissions: {assignment?.stats?.submissionCount ?? 0}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" onClick={() => navigate(`/teacher/assignments/${assignmentId}`)}>
                      View
                    </Button>
                    {status === "draft" ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleAction(assignment, "publish")}
                          loading={isActionBusy(assignmentId, "publish")}
                        >
                          Publish
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleAction(assignment, "delete")}
                          loading={isActionBusy(assignmentId, "delete")}
                        >
                          Delete
                        </Button>
                      </>
                    ) : null}
                    {status === "published" ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleAction(assignment, "close")}
                        loading={isActionBusy(assignmentId, "close")}
                      >
                        Close
                      </Button>
                    ) : null}
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <button
        type="button"
        onClick={() => navigate("/teacher/assignments/create")}
        className="fixed bottom-24 right-5 z-30 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-primaryDark md:bottom-7 md:right-7"
      >
        <Plus className="h-4 w-4" />
        Tao bai tap
      </button>
    </div>
  );
}

export default TeacherAssignmentsPage;
