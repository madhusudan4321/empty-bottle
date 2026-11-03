// Mock data for student experience features
// Matches data contracts specified by the Lead and backend models.

export const MOCK_USER = {
  _id: "student-101",
  name: "Sample Student",
  email: "student@campus.edu",
  role: "student",
};

// Default mock campus location (student's location) until Lead's useGeolocation hook is merged
export const MOCK_USER_COORDINATES = {
  latitude: 12.971598,
  longitude: 77.594566,
};

export const MOCK_WATER_POINTS = [
  {
    _id: "wp-001",
    name: "Main Library - Ground Floor",
    latitude: 12.97185,
    longitude: 77.59482,
    capacity: 15,
    crowdRadius: 50,
    availability: "available",
    temperature: "cold",
    cleanliness: "clean",
    lastUpdated: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
  },
  {
    _id: "wp-002",
    name: "Engineering Block A - 2nd Floor",
    latitude: 12.9722,
    longitude: 77.5951,
    capacity: 10,
    crowdRadius: 40,
    availability: "available",
    temperature: "cool",
    cleanliness: "clean",
    lastUpdated: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    _id: "wp-003",
    name: "Student Cafeteria Entrance",
    latitude: 12.9712,
    longitude: 77.5939,
    capacity: 20,
    crowdRadius: 60,
    availability: "available",
    temperature: "normal",
    cleanliness: "average",
    lastUpdated: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    _id: "wp-004",
    name: "Sports Complex - North Wing",
    latitude: 12.9708,
    longitude: 77.596,
    capacity: 12,
    crowdRadius: 50,
    availability: "unavailable",
    temperature: "warm",
    cleanliness: "dirty",
    lastUpdated: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    _id: "wp-005",
    name: "Science Center - Floor 1",
    latitude: 12.9729,
    longitude: 77.5942,
    capacity: 8,
    crowdRadius: 35,
    availability: "maintenance",
    temperature: "normal",
    cleanliness: "average",
    lastUpdated: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
  },
];

export const MOCK_CROWD_DATA = {
  "wp-001": { level: "LOW", percentage: 20, estimated: true },
  "wp-002": { level: "MODERATE", percentage: 55, estimated: true },
  "wp-003": { level: "HIGH", percentage: 85, estimated: true },
  "wp-004": { level: "LOW", percentage: 10, estimated: true },
  "wp-005": { level: "LOW", percentage: 0, estimated: true },
};

export const MOCK_REPORTS = [
  {
    _id: "rep-001",
    waterPointId: {
      _id: "wp-004",
      name: "Sports Complex - North Wing",
    },
    userId: "student-101",
    issueType: "water_unavailable",
    description: "No water coming out from any of the three taps.",
    status: "open",
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
  {
    _id: "rep-002",
    waterPointId: {
      _id: "wp-003",
      name: "Student Cafeteria Entrance",
    },
    userId: "student-101",
    issueType: "dirty",
    description: "Drain tray is clogged and water basin needs cleaning.",
    status: "in_review",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    _id: "rep-003",
    waterPointId: {
      _id: "wp-002",
      name: "Engineering Block A - 2nd Floor",
    },
    userId: "student-101",
    issueType: "tap_damaged",
    description: "Right tap handle is loose and leaking continuously.",
    status: "resolved",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
];

export const ISSUE_TYPE_LABELS = {
  water_unavailable: "Water Unavailable",
  water_warm: "Water Warm / Not Cooling",
  dirty: "Dirty / Unhygienic",
  tap_damaged: "Tap Damaged",
  leakage: "Water Leakage",
  cooler_not_working: "Cooler Not Working",
  other: "Other Issue",
};
