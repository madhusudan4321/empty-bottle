export default function ErrorMessage({
  title = "Error",
  message,
  onRetry,
  className = "",
}) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className={`rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 ${className}`}
    >
      <div className="flex items-start gap-3">
        <svg
          className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
            clipRule="evenodd"
          />
        </svg>
        <div className="flex-1">
          {title && <h4 className="font-semibold text-sm">{title}</h4>}
          <p className="text-sm mt-0.5 text-red-700">{message}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 text-xs font-semibold text-red-800 hover:text-red-900 underline focus:outline-none"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

