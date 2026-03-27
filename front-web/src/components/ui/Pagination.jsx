import clsx from "clsx";

const buildPages = (current, total) => {
  const pages = [];
  const start = Math.max(1, current - 2);
  const end = Math.min(total, current + 2);
  for (let i = start; i <= end; i += 1) {
    pages.push(i);
  }
  return pages;
};

/**
 * Page navigator with previous/next and number buttons.
 */
function Pagination({ page = 1, totalPages = 1, onPageChange }) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = buildPages(page, totalPages);

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Previous
      </button>

      {pages.map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onPageChange(value)}
          className={clsx(
            "h-9 min-w-9 rounded-xl px-3 text-sm font-semibold transition",
            value === page
              ? "bg-primary text-white"
              : "border border-gray-200 text-gray-700 hover:bg-gray-50",
          )}
        >
          {value}
        </button>
      ))}

      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}

export default Pagination;
