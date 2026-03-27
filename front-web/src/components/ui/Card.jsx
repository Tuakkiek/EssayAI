import clsx from "clsx";

const variantClasses = {
  default: "border border-gray-100",
  success: "border border-primary",
  error: "border border-red-400",
  flat: "border border-transparent shadow-none",
};

const paddingClasses = {
  none: "p-0",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

/**
 * Generic surface card with variants and adjustable padding.
 */
function Card({ children, padding = "md", variant = "default", className }) {
  return (
    <div
      className={clsx(
        "rounded-[22px] bg-white shadow-sm",
        variantClasses[variant] || variantClasses.default,
        paddingClasses[padding] || paddingClasses.md,
        className,
      )}
    >
      {children}
    </div>
  );
}

export default Card;
