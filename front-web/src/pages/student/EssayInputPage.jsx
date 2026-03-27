import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/layout/PageHeader";
import * as toast from "@/utils/toast";
import usePageTitle from "@/hooks/usePageTitle";

const MIN_WORDS = 50;

const countWords = (text) => {
  const trimmed = text.trim();
  if (!trimmed) {
    return 0;
  }
  return trimmed.split(/\s+/).filter(Boolean).length;
};

const getTargetByTask = (taskType) => (taskType === "task1" ? 150 : 250);

const getProgressColorClass = (percent) => {
  if (percent < 60) {
    return "bg-red-500";
  }
  if (percent < 100) {
    return "bg-amber-500";
  }
  return "bg-primary";
};

function EssayInputPage() {
  usePageTitle("Write Essay");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const assignmentId = searchParams.get("assignmentId");
  const [taskType, setTaskType] = useState("task2");
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const wordCount = useMemo(() => countWords(text), [text]);
  const targetWords = useMemo(() => getTargetByTask(taskType), [taskType]);
  const progressPercent = useMemo(() => Math.round((wordCount / targetWords) * 100), [wordCount, targetWords]);
  const clampedProgress = Math.max(0, Math.min(100, progressPercent));

  const handleSubmit = (event) => {
    event.preventDefault();
    if (wordCount < MIN_WORDS) {
      toast.error(`Please write at least ${MIN_WORDS} words.`);
      return;
    }

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    navigate("/student/essay/new", {
      state: {
        draft: {
          text: text.trim(),
          taskType,
          assignmentId: assignmentId || undefined,
        },
      },
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Write your essay"
        subtitle={assignmentId ? "You are submitting for an assignment." : "Practice mode"}
      />

      <Card className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Task 1", value: "task1" },
            { label: "Task 2", value: "task2" },
          ].map((task) => (
            <button
              key={task.value}
              type="button"
              onClick={() => setTaskType(task.value)}
              className={[
                "rounded-full px-4 py-2 text-sm font-semibold transition",
                taskType === task.value
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200",
              ].join(" ")}
            >
              {task.label}
            </button>
          ))}
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Write your essay here..."
            className="min-h-[320px] w-full resize-y rounded-[18px] border border-gray-200 bg-white p-4 text-sm leading-6 text-gray-900 outline-none transition focus:border-primary"
          />

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm font-medium">
              <span className="text-gray-700">
                {wordCount} / {targetWords} words
              </span>
              <span className={wordCount >= targetWords ? "text-primary" : "text-gray-500"}>
                {progressPercent}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full transition-all duration-300 ${getProgressColorClass(
                  progressPercent,
                )}`}
                style={{ width: `${clampedProgress}%` }}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
              Min {MIN_WORDS} words
            </span>
            <span className="rounded-full bg-primaryLight px-3 py-1 text-xs font-semibold text-primaryDark">
              Target: {targetWords}+ words
            </span>
          </div>

          <Button
            type="submit"
            fullWidth
            loading={isSubmitting}
            disabled={wordCount < MIN_WORDS}
          >
            Submit essay
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default EssayInputPage;
