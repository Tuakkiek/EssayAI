import clsx from "clsx";

const variantClasses = {
  primary: "bg-primary text-white hover:bg-primaryDark shadow-sm",
  secondary: "border border-gray-200 bg-white text-gray-800 hover:bg-gray-50",
  ghost: "bg-transparent text-primary hover:bg-primaryLight",
  danger: "bg-red-500 text-white hover:bg-red-600",
};

const sizeClasses = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-base",
};

/**
 * Reusable button with variants, sizes, icon slot, and loading state.
 */
function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon = null,
  fullWidth = false,
  onClick,
  children,
  type = "button",
  className,
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-[18px] font-semibold transition",
        "active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant] || variantClasses.primary,
        sizeClasses[size] || sizeClasses.md,
        fullWidth && "w-full",
        className,
      )}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
      ) : (
        <>
          {icon ? <span className="inline-flex items-center">{icon}</span> : null}
          <span>{children}</span>
        </>
      )}
    </button>
  );
}

export default Button;
