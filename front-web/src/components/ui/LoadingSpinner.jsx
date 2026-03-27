import clsx from "clsx";

const sizeMap = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-10 w-10 border-[3px]",
};

/**
 * Centered spinner with configurable size.
 */
function LoadingSpinner({ size = "md", className }) {
  return (
    <div className={clsx("flex items-center justify-center", className)}>
      <span
        className={clsx(
          "animate-spin rounded-full border-primary/40 border-t-primary",
          sizeMap[size] || sizeMap.md,
        )}
      />
    </div>
  );
}

export default LoadingSpinner;
