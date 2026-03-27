import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import * as studentApi from "@/api/student";
import { getErrorMessage } from "@/api/client";
import * as toast from "@/utils/toast";
import usePageTitle from "@/hooks/usePageTitle";

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 40;

const parseAssignmentResponse = (response) => {
  const root = response?.data ?? {};
  const data = root?.data ?? root;
  return data?.assignment ?? data ?? null;
};

const countWords = (value) => {
  const normalized = value.trim();
  if (!normalized) return 0;
  return normalized.split(/\s+/).filter(Boolean).length;
};

const normalizeStatus = (status) => {
  const key = String(status ?? "").toLowerCase();
  if (key === "scoring") return "grading";
  return key;
};

const getSubmission = (assignment) => assignment?.mySubmission ?? null;

const getSubmissionScore = (submission) => {
  const raw = submission?.overallScore ?? submission?.score ?? submission?.overallBand;
  const numeric = Number(raw);
  return Number.isFinite(numeric) ? numeric : null;
};

const getSubmissionId = (submission) =>
  submission?._id ?? submission?.id ?? submission?.essayId ?? "";

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

const STATUS_VIEW = {
  pending: {
    label: "Đang chờ",
    className: "bg-gray-100 text-gray-700",
  },
  grading: {
    label: "Đang chấm...",
    className: "bg-amber-100 text-amber-700",
  },
  graded: {
    label: "Đã chấm",
    className: "bg-green-100 text-green-700",
  },
  scored: {
    label: "Đã chấm",
    className: "bg-green-100 text-green-700",
  },
  error: {
    label: "Lỗi chấm điểm",
    className: "bg-red-100 text-red-700",
  },
};

function AssignmentDetailPage() {
  usePageTitle("Assignment Detail");
  const navigate = useNavigate();
  const { id } = useParams();
  const [text, setText] = useState("");
  const [optimisticSubmitted, setOptimisticSubmitted] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [pollAttempt, setPollAttempt] = useState(0);
  const [completionOpen, setCompletionOpen] = useState(false);
  const [completionScore, setCompletionScore] = useState(null);

  const pollTimeoutRef = useRef(null);
  const pollAssignmentRef = useRef(null);
  const pollingRef = useRef(false);
  const optimisticSubmittedRef = useRef(false);
  const notifyOnCompleteRef = useRef(false);
  const shownCompletionRef = useRef(false);

  const {
    data: assignment,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["student-assignment-detail", id],
    queryFn: () => studentApi.getAssignmentById(id),
    enabled: Boolean(id),
    select: parseAssignmentResponse,
  });

  useEffect(() => {
    optimisticSubmittedRef.current = optimisticSubmitted;
  }, [optimisticSubmitted]);

  const stopPolling = useCallback(() => {
    if (pollTimeoutRef.current) {
      window.clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
    pollingRef.current = false;
    setIsPolling(false);
    setPollAttempt(0);
  }, []);

  const pollAssignment = useCallback(
    async (attempt = 0) => {
      const result = await refetch();
      const nextAssignment = result?.data;
      if (!nextAssignment) {
        stopPolling();
        return;
      }

      const submission = getSubmission(nextAssignment);
      const status = normalizeStatus(
        submission?.status ?? (optimisticSubmittedRef.current ? "pending" : ""),
      );
      const score = getSubmissionScore(submission);
      const isFinal = score != null || status === "graded" || status === "scored";
      const isErrorStatus = status === "error";

      if (isFinal || isErrorStatus) {
        stopPolling();
        setOptimisticSubmitted(false);

        if (
          notifyOnCompleteRef.current &&
          !shownCompletionRef.current &&
          score != null
        ) {
          shownCompletionRef.current = true;
          setCompletionScore(score);
          setCompletionOpen(true);
        }
        notifyOnCompleteRef.current = false;
        return;
      }

      if (attempt + 1 >= MAX_POLL_ATTEMPTS) {
        stopPolling();
        notifyOnCompleteRef.current = false;
        toast.error("Quá thời gian chờ chấm điểm. Vui lòng thử lại sau.");
        return;
      }

      setPollAttempt(attempt + 1);
      pollTimeoutRef.current = window.setTimeout(() => {
        void pollAssignmentRef.current?.(attempt + 1);
      }, POLL_INTERVAL_MS);
    },
    [refetch, stopPolling],
  );

  useEffect(() => {
    pollAssignmentRef.current = pollAssignment;
  }, [pollAssignment]);

  const startPolling = useCallback(() => {
    if (pollingRef.current) return;
    pollingRef.current = true;
    setIsPolling(true);
    setPollAttempt(0);
    notifyOnCompleteRef.current = true;
    void pollAssignmentRef.current?.(0);
  }, []);

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  const submitMutation = useMutation({
    mutationFn: () => studentApi.submitAssignment(id, text.trim()),
    onMutate: () => {
      setOptimisticSubmitted(true);
      optimisticSubmittedRef.current = true;
      notifyOnCompleteRef.current = true;
      shownCompletionRef.current = false;
    },
    onSuccess: async () => {
      setText("");
      toast.success("Nộp bài thành công.");
      await refetch();
    },
    onError: (submitError) => {
      setOptimisticSubmitted(false);
      optimisticSubmittedRef.current = false;
      notifyOnCompleteRef.current = false;
      toast.error(getErrorMessage(submitError));
    },
  });

  const submission = getSubmission(assignment);
  const hasSubmitted = Boolean(submission) || optimisticSubmitted;
  const status = normalizeStatus(
    submission?.status ?? (hasSubmitted ? "pending" : ""),
  );
  const score = getSubmissionScore(submission);
  const isFinal = score != null || status === "graded" || status === "scored";
  const isErrorStatus = status === "error";
  const isGrading = hasSubmitted && !isFinal && !isErrorStatus;
  const submissionId = getSubmissionId(submission);
  const wordCount = useMemo(() => countWords(text), [text]);

  useEffect(() => {
    if (!isGrading) {
      const stopTimeout = window.setTimeout(() => {
        stopPolling();
      }, 0);
      return () => {
        window.clearTimeout(stopTimeout);
      };
    }

    if (pollingRef.current) {
      return;
    }

    const kickoff = window.setTimeout(() => {
      startPolling();
    }, 0);

    return () => {
      window.clearTimeout(kickoff);
    };
  }, [isGrading, startPolling, stopPolling]);

  const criteria = assignment?.gradingCriteria ?? {};
  const requiredVocabulary = Array.isArray(criteria?.requiredVocabulary)
    ? criteria.requiredVocabulary.filter((item) => String(item?.word || "").trim())
    : [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-16 animate-pulse rounded-[22px] bg-gray-200" />
        <div className="h-32 animate-pulse rounded-[22px] bg-gray-200" />
        <div className="h-64 animate-pulse rounded-[22px] bg-gray-200" />
      </div>
    );
  }

  if (isError || !assignment) {
    return (
      <Card className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Không thể tải bài tập</h2>
        <p className="text-sm text-gray-600" role="alert">
          {getErrorMessage(error)}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => refetch()}>Retry</Button>
          <Button variant="secondary" onClick={() => navigate("/student/assignments")}>
            Quay lại
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate("/student/assignments")}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition hover:bg-gray-200"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">{assignment?.title || "Assignment detail"}</h1>
      </div>

      <Card className="space-y-2">
        <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
          <BookOpen className="h-3.5 w-3.5" />
          Đề bài
        </p>
        <p className="text-sm leading-6 text-gray-700">{assignment?.prompt || "No prompt provided."}</p>
        <p className="text-xs font-medium text-gray-500">Hạn nộp: {formatDate(assignment?.dueDate)}</p>
      </Card>

      {(requiredVocabulary.length > 0 || criteria?.structureRequirements) && (
        <Card className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Tiêu chí chấm điểm</h2>

          {requiredVocabulary.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700">Từ vựng yêu cầu</p>
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
          )}

          {criteria?.structureRequirements ? (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700">Cấu trúc yêu cầu</p>
              <p className="text-sm leading-6 text-gray-700">{criteria.structureRequirements}</p>
            </div>
          ) : null}
        </Card>
      )}

      <Card className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Bài nộp</h2>

        {!hasSubmitted ? (
          <>
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Nhập bài viết của bạn..."
              className="min-h-[240px] w-full resize-y rounded-[18px] border border-gray-200 p-4 text-sm leading-6 text-gray-900 outline-none transition focus:border-primary"
            />
            <p className="text-xs font-medium text-gray-500">{wordCount} words</p>
            <Button
              onClick={() => submitMutation.mutate()}
              loading={submitMutation.isPending}
              disabled={wordCount < 1}
            >
              Nộp bài
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  STATUS_VIEW[status]?.className || STATUS_VIEW.pending.className
                }`}
              >
                {STATUS_VIEW[status]?.label || STATUS_VIEW.pending.label}
              </span>
              {isGrading && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {isPolling ? "Polling..." : "Checking..."} {pollAttempt}/{MAX_POLL_ATTEMPTS}
                </span>
              )}
            </div>

            {isFinal && score != null ? (
              <div className="space-y-3">
                <p className="text-4xl font-black text-primary">{score.toFixed(1)}</p>
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (!submissionId) return;
                    navigate(`/student/essay/${submissionId}`);
                  }}
                >
                  Xem chi tiết kết quả
                </Button>
              </div>
            ) : null}

            {isErrorStatus ? (
              <p className="text-sm text-red-600">Có lỗi trong quá trình chấm điểm. Vui lòng thử lại sau.</p>
            ) : null}
          </>
        )}
      </Card>

      <Modal
        open={completionOpen}
        onClose={() => setCompletionOpen(false)}
        title="Đã chấm xong"
        size="sm"
      >
        <div className="space-y-5 text-center">
          <p className="text-5xl font-black text-primary">
            {completionScore != null ? completionScore.toFixed(1) : "--"}
          </p>
          <Button
            onClick={() => setCompletionOpen(false)}
            fullWidth
          >
            OK
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default AssignmentDetailPage;
