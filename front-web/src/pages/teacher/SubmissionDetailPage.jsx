import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Lightbulb, WandSparkles } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import * as teacherApi from "@/api/teacher";
import { getErrorMessage } from "@/api/client";
import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ScoreBreakdown from "@/components/ui/ScoreBreakdown";
import ScoreDisplay from "@/components/ui/ScoreDisplay";
import StatusBadge from "@/components/ui/StatusBadge";
import * as toast from "@/utils/toast";
import usePageTitle from "@/hooks/usePageTitle";

const toData = (response) => {
  const root = response?.data ?? {};
  return root?.data ?? root;
};

const extractSubmission = (response) => {
  const data = toData(response);
  return data?.submission ?? data?.essay ?? data ?? null;
};

const getStatus = (submission) => String(submission?.status ?? "pending").toLowerCase();

const getScore = (submission) => {
  const raw = submission?.overallScore ?? submission?.score ?? submission?.overallBand ?? 0;
  const numeric = Number(raw);
  return Number.isFinite(numeric) ? numeric : 0;
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

const normalizeGrammarErrors = (errors) => {
  if (!Array.isArray(errors)) return [];

  return errors.map((error) => ({
    original: error?.original || error?.text || "Original phrase",
    corrected:
      error?.corrected ||
      error?.improved ||
      (Array.isArray(error?.suggestions) ? error.suggestions[0] : "") ||
      "Suggested correction",
    explanation: error?.explanation || error?.message || "Review this grammar issue.",
  }));
};

const normalizeSuggestions = (suggestions) => {
  if (!Array.isArray(suggestions)) return [];

  return suggestions.map((item) => ({
    category: item?.category || item?.type || "general",
    text: item?.text || item?.explanation || item?.improved || "Suggested improvement.",
  }));
};

const categoryClass = (category) => {
  const key = String(category).toLowerCase();
  if (key.includes("vocab")) return "bg-blue-100 text-blue-700";
  if (key.includes("structure") || key.includes("task")) return "bg-purple-100 text-purple-700";
  if (key.includes("coherence") || key.includes("clarity")) return "bg-cyan-100 text-cyan-700";
  if (key.includes("grammar")) return "bg-amber-100 text-amber-700";
  return "bg-gray-100 text-gray-700";
};

function SubmissionDetailPage() {
  usePageTitle("Submission Detail");
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [comment, setComment] = useState("");

  const {
    data: submission,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["teacher-submission-detail", id],
    queryFn: () => teacherApi.getSubmissionById(id),
    select: extractSubmission,
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (!submission) return undefined;
    const nextComment = submission?.teacherNote || "";
    const timer = window.setTimeout(() => {
      setComment(nextComment);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [submission]);

  const reviewMutation = useMutation({
    mutationFn: (note) => teacherApi.reviewSubmission(id, note),
    onSuccess: () => {
      toast.success("Review submitted.");
      void refetch();
    },
    onError: (submitError) => {
      toast.error(getErrorMessage(submitError));
    },
  });

  const status = getStatus(submission);
  const score = getScore(submission);
  const isScored = status === "graded" || status === "scored";

  const breakdown = useMemo(() => {
    const raw = submission?.scoreBreakdown ?? {};
    if (raw.taskAchievement == null && raw.taskResponse != null) {
      return { ...raw, taskAchievement: raw.taskResponse };
    }
    return raw;
  }, [submission?.scoreBreakdown]);

  const grammarErrors = useMemo(
    () => normalizeGrammarErrors(submission?.grammarErrors).slice(0, 6),
    [submission?.grammarErrors],
  );

  const suggestions = useMemo(
    () => normalizeSuggestions(submission?.suggestions).slice(0, 6),
    [submission?.suggestions],
  );

  const studentName = submission?.studentId?.name ?? "Student";
  const assignmentTitle = submission?.assignmentId?.title ?? "Assignment";
  const assignmentId = submission?.assignmentId?._id ?? submission?.assignmentId?.id ?? "";
  const backHref = assignmentId
    ? `/teacher/assignments/${assignmentId}/submissions`
    : "/teacher/assignments";

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-20 animate-pulse rounded-[22px] bg-gray-200" />
        <div className="h-40 animate-pulse rounded-[22px] bg-gray-200" />
        <div className="h-40 animate-pulse rounded-[22px] bg-gray-200" />
      </div>
    );
  }

  if (isError || !submission) {
    return (
      <Card className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Cannot load submission</h2>
        <p className="text-sm text-gray-600" role="alert">
          {getErrorMessage(error)}
        </p>
        <Button onClick={() => refetch()}>Retry</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Submission detail" subtitle={assignmentTitle} backHref={backHref} />

      <Card className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm text-gray-500">Student</p>
            <p className="text-lg font-bold text-gray-900">{studentName}</p>
          </div>
          <StatusBadge status={status} />
        </div>
        <p className="text-sm text-gray-600">Submitted: {formatDate(submission?.createdAt)}</p>
      </Card>

      {isScored ? (
        <Card className="space-y-4 text-center">
          <ScoreDisplay score={score} animate />
          <p className="text-sm text-gray-600">Overall score</p>
        </Card>
      ) : (
        <Card className="space-y-2">
          <p className="text-sm text-gray-600">Score not available yet.</p>
        </Card>
      )}

      <Card className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900">AI Feedback</h2>
        <div className="rounded-2xl bg-gray-100 p-4 text-sm leading-6 text-gray-700">
          {submission?.feedback || "No feedback available yet."}
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900">Score breakdown</h2>
        <ScoreBreakdown breakdown={breakdown} />
      </Card>

      {grammarErrors.length > 0 ? (
        <Card className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900">Grammar errors</h2>
          <div className="space-y-2">
            {grammarErrors.map((item, index) => (
              <div key={`${item.original}-${index}`} className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold text-red-600">{item.original}</span>{" "}
                  <span className="text-gray-400">-&gt;</span>{" "}
                  <span className="font-semibold text-green-600">{item.corrected}</span>
                </p>
                <p className="mt-1 text-xs text-gray-600">{item.explanation}</p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {suggestions.length > 0 ? (
        <Card className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900">Suggestions</h2>
          <div className="space-y-2">
            {suggestions.map((item, index) => (
              <div key={`${item.category}-${index}`} className="rounded-2xl border border-gray-100 bg-white p-3">
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${categoryClass(
                    item.category,
                  )}`}
                >
                  {item.category}
                </span>
                <p className="mt-2 text-sm text-gray-700">{item.text}</p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {submission?.scoreBreakdown ? (
        <Card className="flex items-start gap-3 bg-yellow-50">
          <Lightbulb className="mt-0.5 h-5 w-5 text-amber-600" />
          <p className="text-sm font-medium text-amber-800">
            Use the breakdown to identify the weakest criteria before giving feedback.
          </p>
        </Card>
      ) : null}

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Teacher review</h2>
          {submission?.isReviewedByTeacher ? (
            <span className="text-xs font-semibold text-green-700">Reviewed</span>
          ) : null}
        </div>
        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Write a review note for the student..."
          className="min-h-[140px] w-full resize-y rounded-[18px] border border-gray-200 p-4 text-sm leading-6 text-gray-900 outline-none transition focus:border-primary"
        />
        {submission?.teacherNote ? (
          <p className="text-xs text-gray-500">Last note saved on {formatDate(submission?.reviewedAt)}</p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => reviewMutation.mutate(comment.trim())}
            loading={reviewMutation.isPending}
            icon={<WandSparkles className="h-4 w-4" />}
          >
            Submit review
          </Button>
          <Button variant="secondary" onClick={() => navigate(backHref)}>
            Back to submissions
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default SubmissionDetailPage;
