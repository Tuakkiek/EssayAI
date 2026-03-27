import clsx from "clsx";

const sizeClasses = {
  sm: "px-2 py-1 text-[11px]",
  md: "px-3 py-1.5 text-xs",
};

/**
 * Pill badge for short labels.
 */
function Badge({ label, color = "#1F2937", bg = "#F3F4F6", size = "md", className }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full font-semibold",
        sizeClasses[size] || sizeClasses.md,
        className,
      )}
      style={{ color, backgroundColor: bg }}
    >
      {label}
    </span>
  );
}

export default Badge;
