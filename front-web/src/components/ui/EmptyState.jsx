/**
 * Empty-state block with optional action button.
 */
function EmptyState({ icon = null, title, body, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[22px] bg-white px-6 py-10 text-center shadow-sm">
      {icon ? <div className="mb-4 text-primary">{icon}</div> : null}
      <h3 className="text-xl font-bold text-gray-900">{title}</h3>
      {body ? <p className="mt-2 max-w-sm text-sm text-gray-500">{body}</p> : null}
      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-5 rounded-[18px] bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primaryDark"
        >
          {action.label}
        </button>
      ) : null}
    </div>
  );
}

export default EmptyState;
