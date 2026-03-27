import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { History as HistoryIcon, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import StatusBadge from "@/components/ui/StatusBadge";
import PageHeader from "@/components/layout/PageHeader";
import * as essayApi from "@/api/essays";
import { getErrorMessage } from "@/api/client";
import usePageTitle from "@/hooks/usePageTitle";

const PAGE_SIZE = 20;

const parseHistoryResponse = (response) => {
  const root = response?.data ?? {};
  const data = root?.data ?? root;
  const essays = Array.isArray(data?.essays) ? data.essays : Array.isArray(data) ? data : [];
  const pagination = data?.pagination ?? {};

  const page = Number(pagination?.page ?? 1) || 1;
  const limit = Number(pagination?.limit ?? PAGE_SIZE) || PAGE_SIZE;
  const total = Number(pagination?.total ?? essays.length) || essays.length;
  const totalPages = Number(pagination?.pages ?? Math.max(1, Math.ceil(total / limit))) || 1;

  return {
    essays,
    pagination: {
      page,
      total,
      limit,
      totalPages,
    },
  };
};

const formatDate = (value) => {
  if (!value) {
    return "Unknown date";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const getEssayId = (essay) => essay?._id ?? essay?.id ?? "";

const getPreviewText = (essay) => {
  const text = essay?.textPreview ?? essay?.text ?? essay?.originalText ?? "";
  const normalized = String(text).trim();
  if (!normalized) {
    return "No preview available.";
  }
  return normalized.length > 140 ? `${normalized.slice(0, 140)}...` : normalized;
};

const getScore = (essay) => {
  const raw = essay?.overallScore ?? essay?.score ?? essay?.overallBand ?? essay?.mySubmission?.overallScore;
  const numeric = Number(raw);
  return Number.isFinite(numeric) ? numeric : null;
};

const getScoreClass = (score) => {
  if (score == null) return "bg-gray-100 text-gray-600";
  if (score >= 7) return "bg-green-100 text-green-700";
  if (score >= 5) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
};

const normalizeStatus = (status) => {
  const key = String(status ?? "pending").toLowerCase();
  if (key === "scored") return "graded";
  return key;
};

function HistoryPage() {
  usePageTitle("History");
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["student-history", page],
    queryFn: () => essayApi.getHistory(page, PAGE_SIZE),
    select: parseHistoryResponse,
  });

  const essays = data?.essays ?? [];
  const pagination = data?.pagination ?? { page: 1, totalPages: 1, total: 0 };

  const cards = essays.map((essay) => {
    const score = getScore(essay);
    const status = normalizeStatus(essay?.status);
    const id = getEssayId(essay);
    return {
      id,
      score,
      status,
      preview: getPreviewText(essay),
      wordCount: Number(essay?.wordCount ?? 0),
      createdAt: formatDate(essay?.createdAt),
    };
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-28 animate-pulse rounded-[22px] bg-gray-200" />
        <div className="h-28 animate-pulse rounded-[22px] bg-gray-200" />
        <div className="h-28 animate-pulse rounded-[22px] bg-gray-200" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Unable to load history</h2>
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
        title="Essay History"
        subtitle="Track your writing attempts and results."
        actions={
          <Button
            variant="secondary"
            onClick={() => refetch()}
            loading={isFetching}
            icon={<RefreshCw className="h-4 w-4" />}
            className="hidden md:inline-flex"
          >
            Refresh
          </Button>
        }
      />

      {cards.length === 0 ? (
        <EmptyState
          icon={<HistoryIcon className="h-10 w-10" />}
          title="No essays yet!"
          body="Start writing your first essay and your results will appear here."
          action={{
            label: "Viết một bài essay mới",
            onClick: () => navigate("/student/essay/write"),
          }}
        />
      ) : (
        <>
          <div className="space-y-3">
            {cards.map((essay) => (
              <button
                key={essay.id}
                type="button"
                onClick={() => {
                  if (!essay.id) return;
                  navigate(`/student/essay/${essay.id}`);
                }}
                className="w-full rounded-[22px] border border-gray-100 bg-white p-4 text-left shadow-sm transition hover:bg-gray-50"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <StatusBadge status={essay.status} />
                  {essay.score != null ? (
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${getScoreClass(essay.score)}`}>
                      Band {essay.score.toFixed(1)}
                    </span>
                  ) : null}
                </div>

                <p className="mt-3 text-sm leading-6 text-gray-700">{essay.preview}</p>

                <p className="mt-3 text-xs font-medium text-gray-500">
                  {essay.wordCount} words • {essay.createdAt}
                </p>
              </button>
            ))}
          </div>

          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={(nextPage) => {
              setPage(nextPage);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </>
      )}
    </div>
  );
}

export default HistoryPage;
