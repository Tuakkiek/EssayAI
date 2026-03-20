import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "Không rõ hạn";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "short",
  }).format(date);
};

const getScoreColor = (score) => {
  if (score == null || Number.isNaN(score)) return "text-[#6e6e73]";
  if (score < 4) return "text-[#b42318]";
  if (score < 7) return "text-[#1d4ed8]";
  return "text-[#166534]";
};

export default function AssignmentsCard({ items, maxItems = 4, seeAllLink }) {
  const visibleItems = items.slice(0, maxItems);
  return (
    <section className="rounded-[28px] border border-[#e5e5ea] bg-white/90 shadow-[0_20px_40px_rgba(15,23,42,0.1)] backdrop-blur">
      <div className="flex items-center justify-between px-5 pt-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6e6e73]">
            Bài tập
          </p>
          <p className="text-lg font-semibold text-[#1d1d1f]">
            Bài tập sắp tới
          </p>
        </div>
        <div className="rounded-full bg-[#f0fdf4] px-3 py-1 text-xs font-semibold text-[#166534]">
          {items.length} bài
        </div>
      </div>

      <div className="mt-4 divide-y divide-[#ececef]">
        {visibleItems.length === 0 ? (
          <div className="px-5 py-6 text-sm text-[#6e6e73]">
            Hiện chưa có bài tập nào.
          </div>
        ) : (
          visibleItems.map((item) => {
            const dueDate = new Date(item.dueDate);
            const isOverdue = !item.submitted && dueDate < new Date();
            const isDueSoon =
              !item.submitted &&
              !isOverdue &&
              dueDate.getTime() < Date.now() + 3 * 86400000;

            const statusLabel = item.submitted
              ? "Đã nộp"
              : isOverdue
                ? "Quá hạn"
                : isDueSoon
                  ? "Sắp đến hạn"
                  : formatDate(item.dueDate);

            const statusTone = item.submitted
              ? "text-[#2f7d1a]"
              : isOverdue
                ? "text-[#b42318]"
                : isDueSoon
                  ? "text-[#c2410c]"
                  : "text-[#6e6e73]";

            return (
              <Link
                key={item.id}
                to={`/essay/input?assignmentId=${item.id}`}
                className="flex items-center gap-4 px-5 py-4 transition hover:bg-[#f7f7f7]"
              >
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#1d1d1f]">
                    {item.title}
                  </p>
                  <p className={cn("text-xs font-medium", statusTone)}>
                    {statusLabel}
                  </p>
                </div>
              {item.score != null ? (
                <div className={`text-lg font-bold ${getScoreColor(item.score)}`}>
                  {item.score.toFixed(1)}
                </div>
              ) : (
                  <ChevronRight className="h-4 w-4 text-[#9ca3af]" />
                )}
              </Link>
            );
          })
        )}
      </div>

      {items.length > maxItems && (
        <Link
          to={seeAllLink}
          className="flex items-center justify-center gap-2 border-t border-[#ececef] px-5 py-4 text-sm font-semibold text-[#58cc02] transition hover:bg-[#f7f7f7]"
        >
          Xem tất cả {items.length} bài
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </section>
  );
}
