const STEPS = [
  { id: "reported", label: "Reported", icon: "⚠️" },
  { id: "acknowledged", label: "Acknowledged", icon: "👁️" },
  { id: "assigned", label: "Assigned", icon: "👤" },
  { id: "in_progress", label: "In Progress", icon: "🔧" },
  { id: "fixed", label: "Fixed", icon: "✨" },
  { id: "verified", label: "Verified", icon: "✅" },
  { id: "available", label: "Available", icon: "🚰" },
];

export default function StatusTimeline({ currentStatus, className = "" }) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStatus);

  return (
    <div className={`w-full py-4 ${className}`}>
      {/* Desktop / Tablet: Horizontal Stepper */}
      <div className="hidden sm:flex items-center justify-between relative">
        {/* Track Line Behind */}
        <div className="absolute top-1/2 left-4 right-4 h-0.5 -translate-y-1/2 bg-gray-200 z-0" />
        {/* Completed Progress Track */}
        <div
          className="absolute top-1/2 left-4 h-0.5 -translate-y-1/2 bg-blue-600 transition-all duration-300 z-0"
          style={{
            width:
              currentIndex <= 0
                ? "0%"
                : `${(currentIndex / (STEPS.length - 1)) * 95}%`,
          }}
        />

        {STEPS.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isPending = idx > currentIndex;

          return (
            <div
              key={step.id}
              className="flex flex-col items-center relative z-10 group"
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                  isCompleted
                    ? "bg-blue-600 text-white ring-4 ring-blue-50"
                    : isCurrent
                    ? "bg-blue-600 text-white ring-4 ring-blue-100 scale-110 shadow-blue-500/20"
                    : "bg-white text-gray-400 border-2 border-gray-200"
                }`}
                title={step.label}
              >
                {isCompleted ? "✓" : <span>{step.icon}</span>}
              </div>
              <span
                className={`mt-2 text-[11px] font-medium tracking-tight text-center max-w-[70px] ${
                  isCurrent
                    ? "text-blue-700 font-bold"
                    : isCompleted
                    ? "text-gray-800"
                    : "text-gray-400"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Mobile: Compact Vertical / Card Stepper */}
      <div className="sm:hidden space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mb-2">
          <span>Workflow Progress</span>
          <span className="text-blue-600 font-bold">
            Step {Math.max(1, currentIndex + 1)} of {STEPS.length}
          </span>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {STEPS.map((step, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;

            return (
              <div
                key={step.id}
                className={`h-2 rounded-full transition-all ${
                  isCompleted
                    ? "bg-blue-600"
                    : isCurrent
                    ? "bg-blue-500 ring-2 ring-blue-200 animate-pulse"
                    : "bg-gray-200"
                }`}
                title={`${step.label}: ${
                  isCompleted ? "Completed" : isCurrent ? "Current" : "Pending"
                }`}
              />
            );
          })}
        </div>
        <div className="text-center mt-2 text-xs">
          <span className="text-gray-500">Current step: </span>
          <strong className="text-blue-700 font-semibold">
            {STEPS[currentIndex]?.label || currentStatus}
          </strong>
        </div>
      </div>
    </div>
  );
}
