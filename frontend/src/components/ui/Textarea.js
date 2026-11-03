export default function Textarea({
  label,
  id,
  rows = 4,
  error,
  helperText,
  required = false,
  disabled = false,
  className = "",
  ...props
}) {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <textarea
        id={id}
        rows={rows}
        disabled={disabled}
        required={required}
        className={`w-full px-3.5 py-2 text-sm bg-white border rounded-lg transition-colors
          placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${
            error
              ? "border-red-400 focus:border-red-500 focus:ring-red-400 text-red-900"
              : "border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900"
          }
          ${className}`}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-red-600 font-medium">{error}</p>}
      {!error && helperText && (
        <p className="mt-1.5 text-xs text-gray-500">{helperText}</p>
      )}
    </div>
  );
}

