import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Users } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import * as teacherApi from "@/api/teacher";
import { getErrorMessage } from "@/api/client";
import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";
import * as toast from "@/utils/toast";
import usePageTitle from "@/hooks/usePageTitle";

const toData = (response) => {
  const root = response?.data ?? {};
  return root?.data ?? root;
};

const extractAssignment = (response) => {
  const data = toData(response);
  return data?.assignment ?? data ?? null;
};

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

const getAssignmentId = (assignment) => assignment?._id ?? assignment?.id ?? "";

function TeacherAssignmentDetailPage() {
  usePageTitle("Assignment Detail");
  const navigate = useNavigate();
  const { id = "" } = useParams();
  const [showCriteria, setShowCriteria] = useState(true);

  const {
    data: assignment,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["teacher-assignment-detail", id],
    queryFn: () => teacherApi.getAssignmentById(id),
    select: extractAssignment,
    enabled: Boolean(id),
  });

  const actionMutation = useMutation({
    mutationFn: ({ action }) => {
      if (action === "publish") {
        return teacherApi.publishAssignment(id);
      }
      if (action === "close") {
        return teacherApi.closeAssignment(id);
      }
      if (action === "delete") {
        return teacherApi.deleteAssignment(id);
      }
      throw new Error("Unsupported action");
    },
    onSuccess: (_data, variables) => {
      toast.success("Assignment updated.");
      if (variables?.action === "delete") {
        navigate("/teacher/assignments");
        return;
      }
      void refetch();
    },
    onError: (submitError) => {
      toast.error(getErrorMessage(submitError));
    },
  });

  const status = assignment?.status || "draft";
  const className = assignment?.classId?.name ?? "Unknown class";
  const submissionCount = assignment?.stats?.submissionCount ?? 0;
  const maxAttempts = assignment?.maxAttempts ?? 1;

  const criteria = useMemo(() => assignment?.gradingCriteria ?? {}, [assignment?.gradingCriteria]);
  const requiredVocabulary = useMemo(() => {
    const list = Array.isArray(criteria?.requiredVocabulary) ? criteria.requiredVocabulary : [];
    return list.filter((item) => String(item?.word || "").trim());
  }, [criteria]);

  const bandDescriptors = useMemo(() => {
    const list = Array.isArray(criteria?.bandDescriptors) ? criteria.bandDescriptors : [];
    return list.filter((item) => Number(item?.band) && String(item?.descriptor || "").trim());
  }, [criteria]);

  const handleAction = (action) => {
    const labelMap = {
      publish: "publish",
      close: "close",
      delete: "delete",
    };
    const shouldProceed = window.confirm(
      `Do you want to ${labelMap[action] || "update"} this assignment?`,
    );
    if (!shouldProceed) return;
    actionMutation.mutate({ action });
  };

  const isActionBusy = (action) =>
    actionMutation.isPending && actionMutation.variables?.action === action;

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-20 animate-pulse rounded-[22px] bg-gray-200" />
        <div className="h-40 animate-pulse rounded-[22px] bg-gray-200" />
        <div className="h-40 animate-pulse rounded-[22px] bg-gray-200" />
      </div>
    );
  }

  if (isError || !assignment) {
    return (
      <Card className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Cannot load assignment detail</h2>
        <p className="text-sm text-gray-600" role="alert">
          {getErrorMessage(error)}
        </p>
        <Button onClick={() => refetch()}>Retry</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={assignment?.title || "Assignment detail"}
        subtitle={`Class: ${className}`}
        backHref="/teacher/assignments"
        actions={
          <Button
            variant="secondary"
            onClick={() =>
              navigate(`/teacher/assignments/${getAssignmentId(assignment)}/submissions`)
            }
            icon={<Users className="h-4 w-4" />}
          >
            Xem bai nop
          </Button>
        }
      />

      <Card className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <StatusBadge status={status} />
          <div className="text-sm font-medium text-gray-500">
            Due: {formatDate(assignment?.dueDate)}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2">
            <p className="text-xs font-medium text-gray-500">Max attempts</p>
            <p className="text-lg font-bold text-gray-900">{maxAttempts}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2">
            <p className="text-xs font-medium text-gray-500">Submissions</p>
            <p className="text-lg font-bold text-primary">{submissionCount}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2">
            <p className="text-xs font-medium text-gray-500">Task type</p>
            <p className="text-lg font-bold text-gray-900">
              {assignment?.taskType === "task1" ? "Task 1" : "Task 2"}
            </p>
          </div>
        </div>
      </Card>

      <Card className="space-y-2">
        <h2 className="text-lg font-bold text-gray-900">Prompt</h2>
        <p className="text-sm leading-6 text-gray-700">{assignment?.prompt || "-"}</p>
      </Card>

      <Card className="space-y-4">
        <button
          type="button"
          className="flex w-full items-center justify-between text-left"
          onClick={() => setShowCriteria((prev) => !prev)}
        >
          <span className="text-lg font-bold text-gray-900">Grading criteria</span>
          {showCriteria ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>

        {showCriteria ? (
          <div className="space-y-4">
            {criteria?.overview ? (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-gray-700">Overview</p>
                <p className="text-sm text-gray-600">{criteria.overview}</p>
              </div>
            ) : null}

            {requiredVocabulary.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700">Required vocabulary</p>
                <div className="flex flex-wrap gap-2">
                  {requiredVocabulary.map((item, index) => (
                    <span
                      key={`${item.word}-${index}`}
                      className={[
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        item.importance === "required"
                          ? "bg-primary text-white"
                          : "border border-primary text-primary",
                      ].join(" ")}
                    >
                      {item.word}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {bandDescriptors.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700">Band descriptors</p>
                <div className="space-y-2">
                  {bandDescriptors.map((item) => (
                    <div
                      key={`band-${item.band}`}
                      className="rounded-2xl border border-gray-100 bg-gray-50 p-3"
                    >
                      <p className="text-xs font-semibold text-gray-500">Band {item.band}</p>
                      <p className="text-sm text-gray-700">{item.descriptor}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {criteria?.structureRequirements ? (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-gray-700">Structure requirements</p>
                <p className="text-sm text-gray-600">{criteria.structureRequirements}</p>
              </div>
            ) : null}

            {criteria?.penaltyNotes ? (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-gray-700">Penalty notes</p>
                <p className="text-sm text-gray-600">{criteria.penaltyNotes}</p>
              </div>
            ) : null}

            {criteria?.additionalNotes ? (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-gray-700">Additional notes</p>
                <p className="text-sm text-gray-600">{criteria.additionalNotes}</p>
              </div>
            ) : null}

            {!criteria?.overview &&
            requiredVocabulary.length === 0 &&
            bandDescriptors.length === 0 &&
            !criteria?.structureRequirements &&
            !criteria?.penaltyNotes &&
            !criteria?.additionalNotes ? (
              <p className="text-sm text-gray-500">No grading criteria provided.</p>
            ) : null}
          </div>
        ) : null}
      </Card>

      <div className="flex flex-wrap gap-2">
        {status === "draft" ? (
          <>
            <Button onClick={() => handleAction("publish")} loading={isActionBusy("publish")}>
              Publish
            </Button>
            <Button variant="danger" onClick={() => handleAction("delete")} loading={isActionBusy("delete")}>
              Delete
            </Button>
          </>
        ) : null}
        {status === "published" ? (
          <Button variant="secondary" onClick={() => handleAction("close")} loading={isActionBusy("close")}>
            Close
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export default TeacherAssignmentDetailPage;
