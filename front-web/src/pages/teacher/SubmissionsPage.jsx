import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import * as teacherApi from "@/api/teacher";
import { getErrorMessage } from "@/api/client";
import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge from "@/components/ui/StatusBadge";
import usePageTitle from "@/hooks/usePageTitle";

const toData = (response) => {
  const root = response?.data ?? {};
  return root?.data ?? root;
};

const extractSubmissions = (response) => {
  const data = toData(response);

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.submissions)) {
    return data.submissions;
  }

  return [];
};

const getSubmissionId = (submission) => submission?._id ?? submission?.id ?? "";

const getStudentName = (submission) =>
  submission?.studentId?.name ?? submission?.studentName ?? "Student";

const getScore = (submission) => {
  const raw = submission?.overallScore ?? submission?.score ?? submission?.overallBand;
  const numeric = Number(raw);
  return Number.isFinite(numeric) ? numeric : null;
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

function SubmissionsPage() {
  usePageTitle("Submissions");
  const navigate = useNavigate();
  const { id = "" } = useParams();

  const {
    data: submissions = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["teacher-submissions", id],
    queryFn: () => teacherApi.getSubmissions(id),
    select: extractSubmissions,
    enabled: Boolean(id),
  });

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
        <h2 className="text-xl font-bold text-gray-900">Cannot load submissions</h2>
        <p className="text-sm text-gray-600" role="alert">
          {getErrorMessage(error)}
        </p>
        <Button onClick={() => refetch()}>Retry</Button>
      </Card>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Submissions"
          subtitle="No submissions yet for this assignment."
          backHref={`/teacher/assignments/${id}`}
        />
        <EmptyState title="No submissions yet" body="Check back after students submit." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Submissions"
        subtitle={`${submissions.length} submissions`}
        backHref={`/teacher/assignments/${id}`}
      />

      <div className="hidden overflow-x-auto rounded-2xl border border-gray-100 md:block">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Student</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Score</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((submission) => {
              const submissionId = getSubmissionId(submission);
              const score = getScore(submission);
              return (
                <tr key={submissionId} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-medium text-gray-900">{getStudentName(submission)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={submission?.status || "pending"} />
                  </td>
                  <td className="px-4 py-3 text-gray-700">{score != null ? score.toFixed(1) : "-"}</td>
                  <td className="px-4 py-3 text-gray-700">{formatDate(submission?.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => navigate(`/teacher/submissions/${submissionId}`)}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {submissions.map((submission) => {
          const submissionId = getSubmissionId(submission);
          const score = getScore(submission);
          return (
            <Card key={submissionId} className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-base font-semibold text-gray-900">{getStudentName(submission)}</p>
                <StatusBadge status={submission?.status || "pending"} />
              </div>
              <p className="text-sm text-gray-600">Score: {score != null ? score.toFixed(1) : "-"}</p>
              <p className="text-sm text-gray-600">Submitted: {formatDate(submission?.createdAt)}</p>
              <Button variant="secondary" size="sm" onClick={() => navigate(`/teacher/submissions/${submissionId}`)}>
                View
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default SubmissionsPage;
