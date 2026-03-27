import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import * as teacherApi from "@/api/teacher";
import { getErrorMessage } from "@/api/client";
import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import * as toast from "@/utils/toast";
import usePageTitle from "@/hooks/usePageTitle";

const toData = (response) => {
  const root = response?.data ?? {};
  return root?.data ?? root;
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

const getClassId = (cls) => cls?._id ?? cls?.id ?? "";

const getClassLabel = (cls) => {
  const code = cls?.code ? ` (${cls.code})` : "";
  return `${cls?.name || "Unnamed class"}${code}`;
};

const buildBandState = () => ({
  4: "",
  5: "",
  6: "",
  7: "",
  8: "",
});

const getFutureDateString = () => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
};

function AssignmentCreatePage() {
  usePageTitle("Create Assignment");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialClassId = searchParams.get("classId") || "";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [prompt, setPrompt] = useState("");
  const [classId, setClassId] = useState(initialClassId);
  const [dueDate, setDueDate] = useState(getFutureDateString());
  const [maxAttempts, setMaxAttempts] = useState("1");
  const [taskType, setTaskType] = useState("task2");
  const [showCriteria, setShowCriteria] = useState(true);

  const [overview, setOverview] = useState("");
  const [requiredVocabulary, setRequiredVocabulary] = useState([
    { word: "", synonyms: "", importance: "required" },
  ]);
  const [bandDescriptors, setBandDescriptors] = useState(buildBandState());
  const [structureRequirements, setStructureRequirements] = useState("");
  const [penaltyNotes, setPenaltyNotes] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  const [errors, setErrors] = useState({});

  const {
    data: classes = [],
    isLoading: isClassesLoading,
    isError: isClassesError,
    error: classesError,
  } = useQuery({
    queryKey: ["teacher-classes-options"],
    queryFn: () => teacherApi.getClasses({ limit: 200 }),
    select: extractClasses,
  });

  useEffect(() => {
    if (!classId && classes.length > 0) {
      const timer = window.setTimeout(() => {
        setClassId(getClassId(classes[0]));
      }, 0);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [classId, classes]);

  const createMutation = useMutation({
    mutationFn: (payload) => teacherApi.createAssignment(payload),
    onSuccess: (response) => {
      const data = toData(response);
      const assignment = data?.assignment ?? data;
      const newId = assignment?._id ?? assignment?.id;

      toast.success("Assignment created.");

      if (newId) {
        navigate(`/teacher/assignments/${encodeURIComponent(newId)}`, { replace: true });
        return;
      }

      navigate("/teacher/assignments", { replace: true });
    },
    onError: (submitError) => {
      toast.error(getErrorMessage(submitError));
    },
  });

  const hasCriteria = useMemo(() => {
    const hasVocabulary = requiredVocabulary.some((row) => row.word.trim());
    const hasBands = Object.values(bandDescriptors).some((value) => String(value).trim());
    return (
      overview.trim() ||
      structureRequirements.trim() ||
      penaltyNotes.trim() ||
      additionalNotes.trim() ||
      hasVocabulary ||
      hasBands
    );
  }, [
    additionalNotes,
    bandDescriptors,
    overview,
    penaltyNotes,
    requiredVocabulary,
    structureRequirements,
  ]);

  const handleVocabularyChange = (index, field, value) => {
    setRequiredVocabulary((prev) =>
      prev.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row,
      ),
    );
  };

  const handleAddVocabulary = () => {
    setRequiredVocabulary((prev) => [
      ...prev,
      { word: "", synonyms: "", importance: "required" },
    ]);
  };

  const handleRemoveVocabulary = (index) => {
    setRequiredVocabulary((prev) => prev.filter((_, rowIndex) => rowIndex !== index));
  };

  const handleBandDescriptorChange = (band, value) => {
    setBandDescriptors((prev) => ({
      ...prev,
      [band]: value,
    }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!title.trim()) nextErrors.title = "Title is required.";
    if (!prompt.trim()) nextErrors.prompt = "Prompt is required.";
    if (!classId) nextErrors.classId = "Class is required.";
    if (!dueDate) nextErrors.dueDate = "Due date is required.";

    const maxValue = Number(maxAttempts);
    if (!Number.isFinite(maxValue) || maxValue < 1 || maxValue > 10) {
      nextErrors.maxAttempts = "Max attempts must be between 1 and 10.";
    }

    const dueTime = new Date(dueDate).getTime();
    if (!Number.isNaN(dueTime) && dueTime <= Date.now()) {
      nextErrors.dueDate = "Due date must be in the future.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildCriteriaPayload = () => {
    if (!hasCriteria) return undefined;

    const vocab = requiredVocabulary
      .filter((row) => row.word.trim())
      .map((row) => ({
        word: row.word.trim(),
        synonyms: row.synonyms
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        importance: row.importance === "recommended" ? "recommended" : "required",
      }));

    const bandRows = Object.entries(bandDescriptors)
      .filter(([, value]) => String(value).trim())
      .map(([band, value]) => ({
        band: Number(band),
        descriptor: String(value).trim(),
      }));

    return {
      overview: overview.trim() || undefined,
      requiredVocabulary: vocab,
      bandDescriptors: bandRows,
      structureRequirements: structureRequirements.trim() || undefined,
      penaltyNotes: penaltyNotes.trim() || undefined,
      additionalNotes: additionalNotes.trim() || undefined,
    };
  };

  const handleSubmit = (status) => {
    if (!validate()) {
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      prompt: prompt.trim(),
      classId,
      dueDate,
      maxAttempts: Number(maxAttempts),
      taskType,
      status,
      gradingCriteria: buildCriteriaPayload(),
    };

    createMutation.mutate(payload);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Assignment"
        subtitle="Set up a new assignment for your class."
        backHref="/teacher/assignments"
      />

      <Card className="space-y-5">
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Thong tin co ban</h2>

          <Input
            label="Tieu de"
            placeholder="Example: Task 2 Practice"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            error={errors.title}
          />

          <Input
            label="Mo ta (optional)"
            placeholder="Optional notes or objectives"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-800">De bai / Prompt</label>
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              className="min-h-[160px] w-full resize-y rounded-[18px] border border-gray-200 bg-white p-4 text-sm leading-6 text-gray-900 outline-none transition focus:border-primary"
              placeholder="Write the assignment prompt here..."
            />
            {errors.prompt ? <p className="text-xs font-medium text-red-500">{errors.prompt}</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800">Class</label>
              <select
                value={classId}
                onChange={(event) => setClassId(event.target.value)}
                className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-primary"
              >
                {isClassesLoading ? (
                  <option>Loading classes...</option>
                ) : isClassesError ? (
                  <option>Error: {getErrorMessage(classesError)}</option>
                ) : (
                  classes.map((cls) => (
                    <option key={getClassId(cls)} value={getClassId(cls)}>
                      {getClassLabel(cls)}
                    </option>
                  ))
                )}
              </select>
              {errors.classId ? <p className="text-xs font-medium text-red-500">{errors.classId}</p> : null}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800">Task type</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Task 1", value: "task1" },
                  { label: "Task 2", value: "task2" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTaskType(option.value)}
                    className={[
                      "rounded-full px-4 py-2 text-sm font-semibold transition",
                      taskType === option.value
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200",
                    ].join(" ")}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800">Due date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-primary"
              />
              {errors.dueDate ? <p className="text-xs font-medium text-red-500">{errors.dueDate}</p> : null}
            </div>

            <Input
              label="Max attempts"
              type="number"
              min={1}
              max={10}
              value={maxAttempts}
              onChange={(event) => setMaxAttempts(event.target.value)}
              error={errors.maxAttempts}
            />
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <button
          type="button"
          onClick={() => setShowCriteria((prev) => !prev)}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="text-lg font-bold text-gray-900">Tieu chi cham diem VSTEP</span>
          {showCriteria ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>

        {showCriteria ? (
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800">Tong quan</label>
              <textarea
                value={overview}
                onChange={(event) => setOverview(event.target.value)}
                className="min-h-[120px] w-full resize-y rounded-[18px] border border-gray-200 bg-white p-4 text-sm leading-6 text-gray-900 outline-none transition focus:border-primary"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-800">Tu vung yeu cau</p>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<Plus className="h-4 w-4" />}
                  onClick={handleAddVocabulary}
                >
                  Add row
                </Button>
              </div>

              <div className="space-y-3">
                {requiredVocabulary.map((row, index) => (
                  <div key={`vocab-${index}`} className="grid gap-3 sm:grid-cols-4">
                    <input
                      type="text"
                      placeholder="Word"
                      value={row.word}
                      onChange={(event) => handleVocabularyChange(index, "word", event.target.value)}
                      className="h-11 w-full rounded-2xl border border-gray-200 px-3 text-sm outline-none transition focus:border-primary"
                    />
                    <input
                      type="text"
                      placeholder="Synonyms (comma)"
                      value={row.synonyms}
                      onChange={(event) => handleVocabularyChange(index, "synonyms", event.target.value)}
                      className="h-11 w-full rounded-2xl border border-gray-200 px-3 text-sm outline-none transition focus:border-primary"
                    />
                    <select
                      value={row.importance}
                      onChange={(event) =>
                        handleVocabularyChange(index, "importance", event.target.value)
                      }
                      className="h-11 w-full rounded-2xl border border-gray-200 bg-white px-3 text-sm outline-none transition focus:border-primary"
                    >
                      <option value="required">Required</option>
                      <option value="recommended">Recommended</option>
                    </select>
                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveVocabulary(index)}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-800">Thang diem VSTEP</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Object.keys(bandDescriptors).map((band) => (
                  <Input
                    key={band}
                    label={`Band ${band}`}
                    placeholder={`Descriptor for ${band}`}
                    value={bandDescriptors[band]}
                    onChange={(event) => handleBandDescriptorChange(band, event.target.value)}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800">Yeu cau cau truc</label>
              <textarea
                value={structureRequirements}
                onChange={(event) => setStructureRequirements(event.target.value)}
                className="min-h-[120px] w-full resize-y rounded-[18px] border border-gray-200 bg-white p-4 text-sm leading-6 text-gray-900 outline-none transition focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800">Loi bi tru diem nang</label>
              <textarea
                value={penaltyNotes}
                onChange={(event) => setPenaltyNotes(event.target.value)}
                className="min-h-[120px] w-full resize-y rounded-[18px] border border-gray-200 bg-white p-4 text-sm leading-6 text-gray-900 outline-none transition focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800">Ghi chu them</label>
              <textarea
                value={additionalNotes}
                onChange={(event) => setAdditionalNotes(event.target.value)}
                className="min-h-[120px] w-full resize-y rounded-[18px] border border-gray-200 bg-white p-4 text-sm leading-6 text-gray-900 outline-none transition focus:border-primary"
              />
            </div>
          </div>
        ) : null}
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => handleSubmit("draft")} loading={createMutation.isPending}>
          Luu nhap
        </Button>
        <Button
          variant="secondary"
          onClick={() => handleSubmit("published")}
          loading={createMutation.isPending}
        >
          Xuat ban ngay
        </Button>
      </div>
    </div>
  );
}

export default AssignmentCreatePage;
