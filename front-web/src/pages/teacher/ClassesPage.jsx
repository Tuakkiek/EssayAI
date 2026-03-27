import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, RefreshCw, School } from "lucide-react";
import { useNavigate } from "react-router-dom";
import * as teacherApi from "@/api/teacher";
import { getErrorMessage } from "@/api/client";
import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import usePageTitle from "@/hooks/usePageTitle";

const toData = (response) => {
  const root = response?.data ?? {};
  return root?.data ?? root;
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
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

const getClassId = (item) => item?._id ?? item?.id ?? "";

const getAssignmentClassId = (assignment) =>
  assignment?.classId?._id ?? assignment?.classId?.id ?? assignment?.classId ?? "";

function ClassesPage() {
  usePageTitle("Classes");
  const navigate = useNavigate();

  const {
    data: classes = [],
    isLoading: isClassesLoading,
    isError: isClassesError,
    error: classesError,
    refetch: refetchClasses,
  } = useQuery({
    queryKey: ["teacher-classes-grid"],
    queryFn: () => teacherApi.getClasses({ limit: 200 }),
    select: extractClasses,
  });

  const {
    data: assignments = [],
    isLoading: isAssignmentsLoading,
    isError: isAssignmentsError,
    error: assignmentsError,
    refetch: refetchAssignments,
  } = useQuery({
    queryKey: ["teacher-assignments-summary"],
    queryFn: () => teacherApi.getAssignments({ limit: 500 }),
    select: extractAssignments,
  });

  const activeAssignmentsByClass = useMemo(() => {
    const map = new Map();

    assignments.forEach((assignment) => {
      if (assignment?.status === "closed") {
        return;
      }

      const classId = getAssignmentClassId(assignment);
      if (!classId) {
        return;
      }

      map.set(classId, toNumber(map.get(classId)) + 1);
    });

    return map;
  }, [assignments]);

  const isLoading = isClassesLoading || isAssignmentsLoading;
  const isError = isClassesError || isAssignmentsError;
  const error = classesError ?? assignmentsError;

  const handleRefresh = () => {
    void refetchClasses();
    void refetchAssignments();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-28 animate-pulse rounded-[22px] bg-gray-200" />
        <div className="h-28 animate-pulse rounded-[22px] bg-gray-200" />
        <div className="h-28 animate-pulse rounded-[22px] bg-gray-200" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Cannot load classes</h2>
        <p className="text-sm text-gray-600" role="alert">
          {getErrorMessage(error)}
        </p>
        <Button onClick={handleRefresh}>Retry</Button>
      </Card>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="space-y-5">
        <PageHeader title="Classes" subtitle="Organize students into classes and track outcomes." />
        <EmptyState
          icon={<School className="h-10 w-10" />}
          title="No classes yet"
          body="Create your first class to start inviting students."
          action={{
            label: "Create class",
            onClick: () => navigate("/teacher/classes/create"),
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Classes"
        subtitle="Manage classes, students, and assignment activity."
        actions={
          <Button
            variant="secondary"
            onClick={handleRefresh}
            icon={<RefreshCw className="h-4 w-4" />}
          >
            Refresh
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {classes.map((cls, index) => {
          const classId = getClassId(cls);
          const studentCount = toNumber(cls?.studentCount ?? cls?.studentIds?.length);
          const activeAssignments = toNumber(activeAssignmentsByClass.get(classId));

          return (
            <Card key={classId || `class-${index}`} className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-bold text-gray-900">{cls?.name || "Untitled class"}</p>
                  <p className="text-sm text-gray-500">{cls?.description || "No description yet."}</p>
                </div>
                <span className="rounded-full bg-primaryLight px-3 py-1 text-xs font-semibold text-primaryDark">
                  {cls?.code || "N/A"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2">
                  <p className="text-xs font-medium text-gray-500">Students</p>
                  <p className="text-xl font-black text-gray-900">{studentCount}</p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2">
                  <p className="text-xs font-medium text-gray-500">Active assignments</p>
                  <p className="text-xl font-black text-primary">{activeAssignments}</p>
                </div>
              </div>

              <Button
                fullWidth
                variant="secondary"
                onClick={() => navigate(`/teacher/classes/${encodeURIComponent(classId)}`)}
              >
                Xem chi tiet
              </Button>
            </Card>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => navigate("/teacher/classes/create")}
        className="fixed bottom-24 right-5 z-30 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-primaryDark md:bottom-7 md:right-7"
      >
        <Plus className="h-4 w-4" />
        Tao lop moi
      </button>
    </div>
  );
}

export default ClassesPage;
