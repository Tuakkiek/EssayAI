import LoadingSpinner from "./LoadingSpinner";

/**
 * Full-screen loading overlay with message card.
 */
function LoadingOverlay({ visible = false, message = "Loading..." }) {
  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xs rounded-3xl bg-white p-5 text-center shadow-lg">
        <LoadingSpinner size="lg" />
        <p className="mt-3 text-sm font-medium text-gray-700">{message}</p>
      </div>
    </div>
  );
}

export default LoadingOverlay;
