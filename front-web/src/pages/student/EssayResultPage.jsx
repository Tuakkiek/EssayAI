import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ChevronDown, ChevronUp, Lightbulb, WandSparkles } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ScoreDisplay from "@/components/ui/ScoreDisplay";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import * as essayApi from "@/api/essays";
import { getErrorMessage } from "@/api/client";
import usePageTitle from "@/hooks/usePageTitle";

const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 40;
const LOADING_MESSAGES = [
  "Analyzing your ideas...",
  "Checking grammar patterns...",
  "Looking for improvements...",
  "Measuring vocabulary range...",
  "Almost there! Polishing results...",
];

const BREAKDOWN_KEYS = [
  { key: "taskAchievement", fallback: "taskResponse", label: "Task Achievement", color: "#6366F1" },
  { key: "coherenceCohesion", label: "Coherence", color: "#8B5CF6" },
  { key: "lexicalResource", label: "Vocabulary", color: "#EC4899" },
  {
    key: "grammaticalRangeAccuracy",
    fallback: "grammaticalRange",
    label: "Grammar",
    color: "#F59E0B",
  },
];

const clampPercent = (value) => Math.max(0, Math.min(100, (Number(value || 0) / 9) * 100));

const extractEssay = (response) => {
  const root = response?.data ?? {};
  const data = root?.data ?? root;
  const essay = data?.essay ?? data?.submission ?? data;
  return essay && typeof essay === "object" ? essay : null;
};

const extractEssayId = (response) => {
  const root = response?.data ?? {};
  const data = root?.data ?? root;
  const essay = data?.essay ?? data?.submission ?? data;
  return essay?._id ?? essay?.id ?? data?._id ?? data?.id ?? null;
};

const getStatus = (essay) => String(essay?.status ?? "pending").toLowerCase();

const getScore = (essay) => {
  const raw = essay?.overallScore ?? essay?.score ?? essay?.overallBand ?? 0;
  const numeric = Number(raw);
  return Number.isFinite(numeric) ? numeric : 0;
};

const getScoreReaction = (score) => {
  if (score >= 7.5) {
    return {
      emoji: "🌟",
      label: "Excellent!",
      message: "Outstanding work. Your structure and language are very strong.",
    };
  }
  if (score >= 6) {
    return {
      emoji: "🎉",
      label: "Great job!",
      message: "Great progress. You are building a solid writing foundation.",
    };
  }
  if (score >= 5) {
    return {
      emoji: "💪",
      label: "Keep going!",
      message: "Good effort. Keep practicing and your band will keep rising.",
    };
  }
  return {
    emoji: "✨",
    label: "Nice effort!",
    message: "You have a good start. Focused revision will improve your next attempt.",
  };
};

const normalizeGrammarErrors = (errors) => {
  if (!Array.isArray(errors)) {
    return [];
  }

  return errors
    .map((error) => ({
      original: error?.original || error?.text || "Original phrase",
      corrected:
        error?.corrected ||
        error?.improved ||
        (Array.isArray(error?.suggestions) ? error.suggestions[0] : "") ||
        "Suggested correction",
      explanation: error?.explanation || error?.message || "Review this grammar issue.",
    }))
    .slice(0, 6);
};

const normalizeSuggestions = (suggestions) => {
  if (!Array.isArray(suggestions)) {
    return [];
  }

  return suggestions
    .map((item) => ({
      category: item?.category || item?.type || "general",
      text: item?.text || item?.explanation || item?.improved || "Suggested improvement.",
    }))
    .slice(0, 4);
};

const categoryClass = (category) => {
  const key = String(category).toLowerCase();
  if (key.includes("vocab")) return "bg-blue-100 text-blue-700";
  if (key.includes("structure") || key.includes("task")) return "bg-purple-100 text-purple-700";
  if (key.includes("coherence") || key.includes("clarity")) return "bg-cyan-100 text-cyan-700";
  if (key.includes("grammar")) return "bg-amber-100 text-amber-700";
  return "bg-gray-100 text-gray-700";
};

function EssayResultPage() {
  usePageTitle("Essay Result");
  const { id: essayId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const pollTimeoutRef = useRef(null);
  const submitStartedRef = useRef(false);
  const [essay, setEssay] = useState(null);
  const [pollError, setPollError] = useState("");
  const [pollCount, setPollCount] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showAllGrammar, setShowAllGrammar] = useState(false);
  const [showBreakdownBars, setShowBreakdownBars] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const draft = useMemo(() => {
    const state = location.state;
    if (!state || typeof state !== "object") {
      return null;
    }
    const payload = state.draft;
    if (!payload || typeof payload !== "object") {
      return null;
    }
    const text = typeof payload.text === "string" ? payload.text.trim() : "";
    if (!text) {
      return null;
    }
    const taskType = payload.taskType === "task1" ? "task1" : "task2";
    const assignmentId = payload.assignmentId ? String(payload.assignmentId) : undefined;
    return { text, taskType, assignmentId };
  }, [location.state]);

  const clearPollingTimer = useCallback(() => {
    if (pollTimeoutRef.current) {
      window.clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
  }, []);

  const pollEssay = useCallback(
    async (attempt = 0) => {
      if (!essayId || essayId === "new") {
        return;
      }

      try {
        const response = await essayApi.getById(essayId);
        const nextEssay = extractEssay(response);
        const nextStatus = getStatus(nextEssay);

        if (!nextEssay) {
          throw new Error("Cannot parse essay response.");
        }

        setEssay(nextEssay);

        if (nextStatus === "graded" || nextStatus === "scored") {
          return;
        }

        if (nextStatus === "error") {
          setPollError(nextEssay?.errorMessage || "Unable to finish grading.");
          return;
        }

        if (attempt + 1 >= MAX_POLLS) {
          setPollError("Grading is taking longer than expected. Please retry in a moment.");
          return;
        }

        setPollCount(attempt + 1);
        pollTimeoutRef.current = window.setTimeout(() => {
          void pollEssay(attempt + 1);
        }, POLL_INTERVAL_MS);
      } catch (error) {
        if (attempt + 1 >= MAX_POLLS) {
          setPollError(getErrorMessage(error));
          return;
        }

        setPollCount(attempt + 1);
        pollTimeoutRef.current = window.setTimeout(() => {
          void pollEssay(attempt + 1);
        }, POLL_INTERVAL_MS);
      }
    },
    [essayId],
  );

  const restartPolling = useCallback(() => {
    clearPollingTimer();
    setEssay(null);
    setPollError("");
    setPollCount(0);
    setMessageIndex(0);
    setElapsedSeconds(0);
    setShowAllGrammar(false);
    setShowBreakdownBars(false);
    void pollEssay(0);
  }, [clearPollingTimer, pollEssay]);

  const startDraftSubmission = useCallback(() => {
    if (submitStartedRef.current) {
      return () => {};
    }

    submitStartedRef.current = true;

    if (!draft) {
      const draftTimer = window.setTimeout(() => {
        setPollError("Draft is missing. Please submit your essay again.");
      }, 0);
      return () => window.clearTimeout(draftTimer);
    }

    const submitTimer = window.setTimeout(() => {
      setIsSubmitting(true);
    }, 0);

    let isActive = true;
    const submitEssay = async () => {
      try {
        const response = await essayApi.submit(draft.text, draft.taskType, draft.assignmentId);
        const nextId = extractEssayId(response);
        if (!nextId) {
          throw new Error("Essay submitted but missing essay id.");
        }
        if (isActive) {
          navigate(`/student/essay/${nextId}`, { replace: true });
        }
      } catch (error) {
        if (isActive) {
          setPollError(getErrorMessage(error));
        }
      } finally {
        if (isActive) {
          setIsSubmitting(false);
        }
      }
    };

    void submitEssay();

    return () => {
      isActive = false;
      window.clearTimeout(submitTimer);
    };
  }, [draft, navigate]);

  const canPoll = Boolean(essayId) && essayId !== "new";

  useEffect(() => {
    if (!canPoll) {
      return undefined;
    }

    const kickoffTimeout = window.setTimeout(() => {
      restartPolling();
    }, 0);

    return () => {
      window.clearTimeout(kickoffTimeout);
      clearPollingTimer();
    };
  }, [canPoll, clearPollingTimer, restartPolling]);

  useEffect(() => {
    if (essayId !== "new") {
      return undefined;
    }

    return startDraftSubmission();
  }, [essayId, startDraftSubmission]);

  const status = getStatus(essay);
  const isWaiting = !pollError && (status === "pending" || status === "grading");
  const isDone = status === "graded" || status === "scored";
  const waitingMessage = isSubmitting ? "Submitting your essay..." : LOADING_MESSAGES[messageIndex];

  const handleRetry = () => {
    if (essayId === "new") {
      submitStartedRef.current = false;
      setEssay(null);
      setPollError("");
      setPollCount(0);
      setMessageIndex(0);
      setElapsedSeconds(0);
      setShowAllGrammar(false);
      setShowBreakdownBars(false);
      startDraftSubmission();
      return;
    }

    restartPolling();
  };

  useEffect(() => {
    if (!isWaiting) {
      return undefined;
    }

    const messageTimer = window.setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2500);

    const elapsedTimer = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      window.clearInterval(messageTimer);
      window.clearInterval(elapsedTimer);
    };
  }, [isWaiting]);

  useEffect(() => {
    if (!isDone) {
      return undefined;
    }

    const breakdownTimer = window.setTimeout(() => {
      setShowBreakdownBars(true);
    }, 40);

    return () => {
      window.clearTimeout(breakdownTimer);
    };
  }, [isDone]);

  const score = useMemo(() => getScore(essay), [essay]);
  const reaction = useMemo(() => getScoreReaction(score), [score]);
  const feedbackText = useMemo(
    () => essay?.feedback || essay?.aiFeedback || "No feedback available yet.",
    [essay],
  );

  const breakdownRows = useMemo(() => {
    const breakdown = essay?.scoreBreakdown || {};
    return BREAKDOWN_KEYS.map((item) => {
      const value = Number(
        breakdown[item.key] ??
          (item.fallback ? breakdown[item.fallback] : 0) ??
          0,
      );
      return {
        ...item,
        value,
        width: clampPercent(value),
      };
    });
  }, [essay?.scoreBreakdown]);

  const focusArea = useMemo(() => {
    if (!breakdownRows.length) {
      return "";
    }
    if (breakdownRows.every((item) => item.value <= 0)) {
      return "";
    }
    const sorted = [...breakdownRows].sort((a, b) => a.value - b.value);
    return sorted[0]?.label || "";
  }, [breakdownRows]);

  const grammarErrors = useMemo(() => normalizeGrammarErrors(essay?.grammarErrors), [essay?.grammarErrors]);
  const visibleGrammarErrors = showAllGrammar ? grammarErrors : grammarErrors.slice(0, 3);
  const suggestions = useMemo(() => normalizeSuggestions(essay?.suggestions), [essay?.suggestions]);

  if (pollError) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Card className="space-y-4 text-center">
          <p className="text-5xl">😅</p>
          <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
          <p className="text-sm text-gray-600" role="alert">
            {pollError}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={handleRetry}>Retry</Button>
            <Button variant="secondary" onClick={() => navigate("/student/history")}>
              View history
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (isWaiting || !essay) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-4">
        <Card className="w-full space-y-4 text-center">
          <LoadingSpinner size="lg" />
          <p className="text-lg font-bold text-gray-900">{waitingMessage}</p>
          {canPoll ? (
            <p className="text-sm text-gray-500">
              Polling attempt {Math.min(pollCount + 1, MAX_POLLS)} / {MAX_POLLS}
            </p>
          ) : null}
          {elapsedSeconds > 8 ? (
            <p className="text-xs font-medium text-amber-600">Elapsed time: {elapsedSeconds}s</p>
          ) : null}
        </Card>
      </div>
    );
  }

  const nextActionPath = essay?.assignmentId ? "/student/assignments" : "/student/essay/write";

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Card className="space-y-3 text-center">
        <p className="text-5xl">{reaction.emoji}</p>
        <ScoreDisplay score={score} animate />
        <p className="text-lg font-bold text-gray-900">{reaction.label}</p>
        <p className="mx-auto max-w-xl text-sm text-gray-600">{reaction.message}</p>
      </Card>

      {focusArea ? (
        <Card className="flex items-start gap-3 bg-yellow-50">
          <Lightbulb className="mt-0.5 h-5 w-5 text-amber-600" />
          <p className="text-sm font-medium text-amber-800">
            Focus area: Work on <span className="font-bold">{focusArea}</span> to boost your overall band.
          </p>
        </Card>
      ) : null}

      <Card className="space-y-2">
        <h2 className="text-lg font-bold text-gray-900">AI Feedback</h2>
        <div className="rounded-2xl bg-gray-100 p-4 text-sm leading-6 text-gray-700">{feedbackText}</div>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Score Breakdown</h2>
        {breakdownRows.map((row) => (
          <div key={row.key} className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">{row.label}</p>
              <p className="text-sm font-bold text-gray-900">{row.value.toFixed(1)}</p>
            </div>
            <div className="h-2 rounded-full bg-gray-100">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: showBreakdownBars ? `${row.width}%` : "0%",
                  backgroundColor: row.color,
                }}
              />
            </div>
          </div>
        ))}
      </Card>

      {grammarErrors.length > 0 ? (
        <Card className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900">Grammar Errors</h2>
          <div className="space-y-2">
            {visibleGrammarErrors.map((item, index) => (
              <div key={`${item.original}-${index}`} className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold text-red-600">{item.original}</span>{" "}
                  <span className="text-gray-400">→</span>{" "}
                  <span className="font-semibold text-green-600">{item.corrected}</span>
                </p>
                <p className="mt-1 text-xs text-gray-600">{item.explanation}</p>
              </div>
            ))}
          </div>

          {grammarErrors.length > 3 ? (
            <button
              type="button"
              onClick={() => setShowAllGrammar((prev) => !prev)}
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primaryDark"
            >
              {showAllGrammar ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Show more
                </>
              )}
            </button>
          ) : null}
        </Card>
      ) : null}

      {suggestions.length > 0 ? (
        <Card className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900">Suggestions</h2>
          <div className="space-y-2">
            {suggestions.map((item, index) => (
              <div key={`${item.category}-${index}`} className="rounded-2xl border border-gray-100 bg-white p-3">
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${categoryClass(item.category)}`}>
                  {item.category}
                </span>
                <p className="mt-2 text-sm text-gray-700">{item.text}</p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <Card className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => navigate(nextActionPath)} icon={<WandSparkles className="h-4 w-4" />}>
            Lam bai tiep theo
          </Button>
          <Button variant="ghost" onClick={() => navigate("/student/history")}>
            Xem lich su
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default EssayResultPage;
