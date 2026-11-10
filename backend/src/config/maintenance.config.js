// Status workflow ordering:
// reported -> acknowledged -> assigned -> in_progress -> fixed -> verified -> available
const STATUS_FLOW = [
  "reported",
  "acknowledged",
  "assigned",
  "in_progress",
  "fixed",
  "verified",
  "available",
];

const PRIORITY_THRESHOLDS = {
  // distinct reporters count -> priority
  1: "low",
  2: "medium",
  3: "high", // 3 or 4
  4: "high",
  5: "critical", // 5 or more
};

const getPriorityFromDistinctCount = (count) => {
  if (count <= 1) return "low";
  if (count === 2) return "medium";
  if (count === 3 || count === 4) return "high";
  return "critical";
};

// Map issue type to water point impact on acknowledge
// water_unavailable -> "unavailable"
// tap_damaged, leakage, cooler_not_working -> "maintenance"
// water_warm -> temperature "warm"
// dirty -> cleanliness "dirty"
// other -> no change
const ISSUE_WATERPOINT_EFFECTS = {
  water_unavailable: { availability: "unavailable" },
  tap_damaged: { availability: "maintenance" },
  leakage: { availability: "maintenance" },
  cooler_not_working: { availability: "maintenance" },
  water_warm: { temperature: "warm" },
  dirty: { cleanliness: "dirty" },
  other: {},
};

module.exports = {
  STATUS_FLOW,
  PRIORITY_THRESHOLDS,
  getPriorityFromDistinctCount,
  ISSUE_WATERPOINT_EFFECTS,
};

