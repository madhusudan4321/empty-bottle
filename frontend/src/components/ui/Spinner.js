export default function Spinner({
  size = "md",
  className = "",
  label = "Loading...",
}) {
  const sizeMap = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const chosenSize = sizeMap[size] || sizeMap.md;

  return (
    <div
      role="status"
      className={`inline-flex items-center justify-center ${className}`}
    >
      <svg
        className={`animate-spin text-blue-600 ${chosenSize}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  );
}

