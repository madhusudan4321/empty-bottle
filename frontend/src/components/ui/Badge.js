export default function Badge({
  children,
  variant = "gray",
  size = "md",
  className = "",
  ...props
}) {
  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs font-medium",
    md: "px-2.5 py-1 text-xs font-semibold",
    lg: "px-3 py-1.5 text-sm font-semibold",
  };

  const variantStyles = {
    gray: "bg-gray-100 text-gray-700 border-gray-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    cyan: "bg-cyan-50 text-cyan-700 border-cyan-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
    red: "bg-rose-50 text-rose-700 border-rose-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
  };

  const chosenVariant = variantStyles[variant] || variantStyles.gray;
  const chosenSize = sizeStyles[size] || sizeStyles.md;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${chosenVariant} ${chosenSize} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

// Availability: "available" | "unavailable" | "maintenance"
export function AvailabilityBadge({ availability, className = "" }) {
  const map = {
    available: { label: "Available", variant: "green", dot: "bg-emerald-500" },
    unavailable: { label: "Unavailable", variant: "red", dot: "bg-rose-500" },
    maintenance: {
      label: "In Maintenance",
      variant: "amber",
      dot: "bg-amber-500",
    },
  };

  const config = map[availability] || {
    label: availability || "Unknown",
    variant: "gray",
    dot: "bg-gray-400",
  };

  return (
    <Badge variant={config.variant} className={className}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </Badge>
  );
}

// Crowd Badge: MUST always be clearly labeled as Estimated
export function CrowdBadge({ level, percentage, className = "" }) {
  const normalizedLevel = (level || "").toUpperCase();
  const map = {
    LOW: { label: "Low Crowd", variant: "green" },
    MODERATE: { label: "Moderate Crowd", variant: "amber" },
    HIGH: { label: "High Crowd", variant: "red" },
  };

  const config = map[normalizedLevel] || {
    label: "Crowd Unknown",
    variant: "gray",
  };

  return (
    <Badge variant={config.variant} className={className}>
      <span>{config.label}</span>
      {typeof percentage === "number" && (
        <span className="opacity-75 font-normal">({percentage}%)</span>
      )}
      <span className="ml-0.5 text-[10px] font-normal uppercase tracking-wider opacity-70">
        [Estimated]
      </span>
    </Badge>
  );
}

// Cleanliness: "clean" | "average" | "dirty"
export function CleanlinessBadge({ cleanliness, className = "" }) {
  const map = {
    clean: { label: "Clean", variant: "green" },
    average: { label: "Average Cleanliness", variant: "blue" },
    dirty: { label: "Needs Cleaning", variant: "red" },
  };

  const config = map[cleanliness] || {
    label: cleanliness || "Unknown",
    variant: "gray",
  };

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}

// Temperature: "cold" | "cool" | "normal" | "warm"
export function TemperatureBadge({ temperature, className = "" }) {
  const map = {
    cold: { label: "Cold Water", variant: "cyan" },
    cool: { label: "Cool Water", variant: "blue" },
    normal: { label: "Normal Temp", variant: "gray" },
    warm: { label: "Warm Water", variant: "orange" },
  };

  const config = map[temperature] || {
    label: temperature || "Unknown",
    variant: "gray",
  };

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}

// Report Status: "open" | "in_review" | "resolved"
export function StatusBadge({ status, className = "" }) {
  const map = {
    open: { label: "Open", variant: "amber" },
    in_review: { label: "In Review", variant: "blue" },
    resolved: { label: "Resolved", variant: "green" },
  };

  const config = map[status] || {
    label: status || "Unknown",
    variant: "gray",
  };

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
