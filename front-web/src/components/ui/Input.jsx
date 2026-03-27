import clsx from "clsx";

/**
 * Form input with label, hint, icon, and animated error styling.
 */
function Input({
  label,
  error,
  hint,
  icon = null,
  type = "text",
  placeholder,
  value,
  onChange,
  className,
  ...rest
}) {
  return (
    <div className={clsx("space-y-2", className)}>
      {label ? <label className="block text-sm font-semibold text-gray-800">{label}</label> : null}

      <div
        className={clsx(
          "flex h-12 items-center gap-2 rounded-2xl border-[1.5px] bg-white px-4 transition",
          error
            ? "animate-input-shake border-red-400 focus-within:border-red-500"
            : "border-gray-200 focus-within:border-primary",
        )}
      >
        {icon ? <span className="text-gray-400">{icon}</span> : null}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="h-full w-full border-0 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
          {...rest}
        />
      </div>

      {error ? <p className="text-xs font-medium text-red-500">{error}</p> : null}
      {!error && hint ? <p className="text-xs text-gray-500">{hint}</p> : null}
    </div>
  );
}

export default Input;
