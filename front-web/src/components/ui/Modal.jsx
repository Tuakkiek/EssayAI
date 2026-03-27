import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import clsx from "clsx";

const sizeMap = {
  sm: "max-w-md",
  md: "max-w-2xl",
  lg: "max-w-4xl",
};

/**
 * Centered modal with backdrop blur and close button.
 */
function Modal({ open, onClose, title, children, size = "md" }) {
  const titleId = useId();
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const dialog = dialogRef.current;
    if (dialog) {
      dialog.focus();
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={clsx(
          "w-full rounded-[24px] bg-white shadow-xl",
          sizeMap[size] || sizeMap.md,
        )}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 id={titleId} className="text-lg font-bold text-gray-900">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

export default Modal;
