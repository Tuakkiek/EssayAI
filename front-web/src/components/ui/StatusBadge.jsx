import clsx from "clsx";

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    color: "text-gray-600",
    bg: "bg-gray-100",
  },
  grading: {
    label: "Grading",
    color: "text-amber-700",
    bg: "bg-amber-100",
  },
  graded: {
    label: "Graded",
    color: "text-green-700",
    bg: "bg-green-100",
  },
  scored: {
    label: "Scored",
    color: "text-green-700",
    bg: "bg-green-100",
  },
  error: {
    label: "Error",
    color: "text-red-700",
    bg: "bg-red-100",
  },
  draft: {
    label: "Draft",
    color: "text-slate-700",
    bg: "bg-slate-100",
  },
  published: {
    label: "Published",
    color: "text-blue-700",
    bg: "bg-blue-100",
  },
  closed: {
    label: "Closed",
    color: "text-zinc-700",
    bg: "bg-zinc-200",
  },
};

/**
 * Badge with normalized color mapping for system statuses.
 */
function StatusBadge({ status = "pending" }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        config.color,
        config.bg,
      )}
    >
      {config.label}
    </span>
  );
}

export default StatusBadge;
