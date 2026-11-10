const mongoose = require("mongoose");
const MaintenanceRequest = require("../models/MaintenanceRequest");
const StatusReport = require("../models/StatusReport");
const WaterPoint = require("../models/WaterPoint");
const User = require("../models/User");
const {
  STATUS_FLOW,
  getPriorityFromDistinctCount,
  ISSUE_WATERPOINT_EFFECTS,
} = require("../config/maintenance.config");

const PRIORITY_RANK = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

/**
 * Links a student report to an existing open maintenance request or creates a new one.
 * Recomputes priority based on the number of distinct reporter userIds.
 */
const upsertFromReport = async (report) => {
  if (!report || !report.waterPointId || !report.issueType) {
    return null;
  }

  // 1. Find an open maintenance request for the same water point and issue
  let maintenanceReq = await MaintenanceRequest.findOne({
    waterPointId: report.waterPointId,
    issue: report.issueType,
    status: { $ne: "available" },
  });

  if (!maintenanceReq) {
    // Create new request
    maintenanceReq = new MaintenanceRequest({
      waterPointId: report.waterPointId,
      issue: report.issueType,
      reportIds: [report._id],
      status: "reported",
      priority: "low",
    });
  } else {
    // Add reportId if not already present
    const exists = maintenanceReq.reportIds.some(
      (id) => id.toString() === report._id.toString()
    );
    if (!exists) {
      maintenanceReq.reportIds.push(report._id);
    }
  }

  // 2. Fetch linked reports to count distinct userIds
  const linkedReports = await StatusReport.find({
    _id: { $in: maintenanceReq.reportIds },
  }).select("userId");

  const distinctUserIds = new Set(
    linkedReports.map((r) => r.userId.toString())
  );
  maintenanceReq.priority = getPriorityFromDistinctCount(distinctUserIds.size);

  await maintenanceReq.save();
  return maintenanceReq;
};

/**
 * Acknowledge a maintenance request (Admin only)
 * Updates linked reports to 'in_review' and applies issue effect to WaterPoint.
 */
const acknowledge = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw { status: 400, message: "Invalid maintenance request ID format" };
  }

  const req = await MaintenanceRequest.findById(id);
  if (!req) {
    throw { status: 404, message: "Maintenance request not found" };
  }

  if (req.status !== "reported") {
    throw {
      status: 400,
      message: `Cannot acknowledge request in status '${req.status}'. Allowed only from 'reported'.`,
    };
  }

  req.status = "acknowledged";
  await req.save();

  // Update all linked reports to "in_review"
  if (req.reportIds && req.reportIds.length > 0) {
    await StatusReport.updateMany(
      { _id: { $in: req.reportIds } },
      { status: "in_review" }
    );
  }

  // Apply effect to water point
  const effect = ISSUE_WATERPOINT_EFFECTS[req.issue] || {};
  const wpUpdates = {
    ...effect,
    lastUpdated: new Date(),
  };

  await WaterPoint.findByIdAndUpdate(req.waterPointId, wpUpdates);

  return await getMaintenanceRequestById(id);
};

/**
 * Assign a maintenance request to active staff member (Admin only)
 */
const assign = async (id, staffId) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw { status: 400, message: "Invalid maintenance request ID format" };
  }

  if (!staffId || !mongoose.Types.ObjectId.isValid(staffId)) {
    throw { status: 400, message: "A valid staffId is required" };
  }

  const req = await MaintenanceRequest.findById(id);
  if (!req) {
    throw { status: 404, message: "Maintenance request not found" };
  }

  if (req.status !== "acknowledged" && req.status !== "assigned") {
    throw {
      status: 400,
      message: `Cannot assign request in status '${req.status}'. Allowed from 'acknowledged' or 'assigned'.`,
    };
  }

  const staffUser = await User.findById(staffId);
  if (!staffUser || staffUser.role !== "staff" || !staffUser.isActive) {
    throw {
      status: 400,
      message: "Target user is not an active staff member",
    };
  }

  req.assignedStaff = staffUser._id;
  req.status = "assigned";
  await req.save();

  return await getMaintenanceRequestById(id);
};

/**
 * Update request status (Staff for assigned/in_progress -> fixed, or Admin)
 */
const updateStatus = async (id, newStatus, user) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw { status: 400, message: "Invalid maintenance request ID format" };
  }

  const req = await MaintenanceRequest.findById(id);
  if (!req) {
    throw { status: 404, message: "Maintenance request not found" };
  }

  const currentIndex = STATUS_FLOW.indexOf(req.status);
  const targetIndex = STATUS_FLOW.indexOf(newStatus);

  if (targetIndex === -1) {
    throw {
      status: 400,
      message: `Invalid status '${newStatus}'. Allowed: ${STATUS_FLOW.join(", ")}`,
    };
  }

  if (targetIndex !== currentIndex + 1) {
    throw {
      status: 400,
      message: `Cannot skip or revert status from '${req.status}' to '${newStatus}'. Next allowed status is '${STATUS_FLOW[currentIndex + 1]}'.`,
    };
  }

  // Permission checks
  if (user.role === "staff") {
    if (!req.assignedStaff || !req.assignedStaff.equals(user._id)) {
      throw {
        status: 403,
        message: "You are not assigned to this maintenance request",
      };
    }
    // Staff can only move assigned -> in_progress or in_progress -> fixed
    if (newStatus !== "in_progress" && newStatus !== "fixed") {
      throw {
        status: 403,
        message: "Staff can only transition requests to 'in_progress' or 'fixed'",
      };
    }
  }

  // Handle terminal/special status logic
  if (newStatus === "verified") {
    if (user.role !== "admin") {
      throw { status: 403, message: "Only admin can verify requests" };
    }
    return await verify(id);
  }

  if (newStatus === "available") {
    if (user.role !== "admin") {
      throw { status: 403, message: "Only admin can complete requests" };
    }
    return await complete(id);
  }

  if (newStatus === "acknowledged") {
    return await acknowledge(id);
  }

  req.status = newStatus;
  await req.save();

  return await getMaintenanceRequestById(id, user);
};

/**
 * Verify fixed maintenance request (Admin only: fixed -> verified)
 */
const verify = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw { status: 400, message: "Invalid maintenance request ID format" };
  }

  const req = await MaintenanceRequest.findById(id);
  if (!req) {
    throw { status: 404, message: "Maintenance request not found" };
  }

  if (req.status !== "fixed") {
    throw {
      status: 400,
      message: `Cannot verify request in status '${req.status}'. Allowed only from 'fixed'.`,
    };
  }

  req.status = "verified";
  await req.save();

  return await getMaintenanceRequestById(id);
};

/**
 * Complete maintenance request (Admin only: verified -> available)
 * Restores water point to available/normal/clean, resolves linked reports.
 */
const complete = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw { status: 400, message: "Invalid maintenance request ID format" };
  }

  const req = await MaintenanceRequest.findById(id);
  if (!req) {
    throw { status: 404, message: "Maintenance request not found" };
  }

  if (req.status !== "verified") {
    throw {
      status: 400,
      message: `Cannot complete request in status '${req.status}'. Allowed only from 'verified'.`,
    };
  }

  req.status = "available";
  req.completedAt = new Date();
  await req.save();

  // Restore water point status
  const wpUpdates = {
    availability: "available",
    lastUpdated: new Date(),
  };

  if (req.issue === "water_warm") {
    wpUpdates.temperature = "normal";
  } else if (req.issue === "dirty") {
    wpUpdates.cleanliness = "clean";
  }

  await WaterPoint.findByIdAndUpdate(req.waterPointId, wpUpdates);

  // Set all linked reports to "resolved"
  if (req.reportIds && req.reportIds.length > 0) {
    await StatusReport.updateMany(
      { _id: { $in: req.reportIds } },
      { status: "resolved" }
    );
  }

  return await getMaintenanceRequestById(id);
};

/**
 * Get maintenance requests list
 */
const getMaintenanceRequests = async (user, filters = {}) => {
  const query = {};

  if (user.role === "staff") {
    query.assignedStaff = user._id;
  }

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.waterPointId && mongoose.Types.ObjectId.isValid(filters.waterPointId)) {
    query.waterPointId = filters.waterPointId;
  }

  const requests = await MaintenanceRequest.find(query)
    .populate("waterPointId", "name building floor landmark latitude longitude crowdRadius availability")
    .populate("assignedStaff", "name email isActive")
    .populate({
      path: "reportIds",
      select: "userId issueType description createdAt status",
      populate: { path: "userId", select: "name" },
    })
    .lean();

  const formatted = requests.map((item) => {
    const reportList = item.reportIds || [];
    const distinctReporters = new Set(
      reportList.map((r) => (r.userId?._id || r.userId)?.toString()).filter(Boolean)
    );

    return {
      ...item,
      reportCount: reportList.length,
      distinctReporterCount: distinctReporters.size,
    };
  });

  // Sort by priority (critical -> high -> medium -> low), then oldest first (createdAt: 1)
  formatted.sort((a, b) => {
    const rankA = PRIORITY_RANK[a.priority] || 0;
    const rankB = PRIORITY_RANK[b.priority] || 0;
    if (rankB !== rankA) {
      return rankB - rankA;
    }
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

  return formatted;
};

/**
 * Get single maintenance request by ID
 */
const getMaintenanceRequestById = async (id, user = null) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw { status: 400, message: "Invalid maintenance request ID format" };
  }

  const req = await MaintenanceRequest.findById(id)
    .populate("waterPointId", "name building floor landmark latitude longitude crowdRadius availability")
    .populate("assignedStaff", "name email isActive")
    .populate({
      path: "reportIds",
      select: "userId issueType description createdAt status",
      populate: { path: "userId", select: "name" },
    })
    .lean();

  if (!req) {
    throw { status: 404, message: "Maintenance request not found" };
  }

  if (user && user.role === "staff") {
    if (!req.assignedStaff || req.assignedStaff._id.toString() !== user._id.toString()) {
      throw {
        status: 403,
        message: "You are not assigned to this maintenance request",
      };
    }
  }

  const reportList = req.reportIds || [];
  const distinctReporters = new Set(
    reportList.map((r) => (r.userId?._id || r.userId)?.toString()).filter(Boolean)
  );

  return {
    ...req,
    reportCount: reportList.length,
    distinctReporterCount: distinctReporters.size,
  };
};

/**
 * Overview statistics for admin dashboard
 */
const getAdminOverview = async () => {
  const [totalWaterPoints, availablePoints, maintenancePoints, unavailablePoints] =
    await Promise.all([
      WaterPoint.countDocuments(),
      WaterPoint.countDocuments({ availability: "available" }),
      WaterPoint.countDocuments({ availability: "maintenance" }),
      WaterPoint.countDocuments({ availability: "unavailable" }),
    ]);

  const openReportsCount = await StatusReport.countDocuments({
    status: { $ne: "resolved" },
  });

  const openRequests = await MaintenanceRequest.find({
    status: { $ne: "available" },
  }).select("status priority createdAt");

  const requestsByStatus = {
    reported: 0,
    acknowledged: 0,
    assigned: 0,
    in_progress: 0,
    fixed: 0,
    verified: 0,
  };

  const requestsByPriority = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };

  for (const r of openRequests) {
    if (requestsByStatus[r.status] !== undefined) {
      requestsByStatus[r.status] += 1;
    }
    if (requestsByPriority[r.priority] !== undefined) {
      requestsByPriority[r.priority] += 1;
    }
  }

  // Calculate average time to fix (completedAt - createdAt) in milliseconds/hours
  const completedRequests = await MaintenanceRequest.find({
    status: "available",
    completedAt: { $ne: null },
  }).select("createdAt completedAt");

  let avgTimeToFixHours = null;
  if (completedRequests.length > 0) {
    const totalMs = completedRequests.reduce((acc, curr) => {
      return acc + (new Date(curr.completedAt) - new Date(curr.createdAt));
    }, 0);
    avgTimeToFixHours = Math.round((totalMs / completedRequests.length / (1000 * 60 * 60)) * 10) / 10;
  }

  return {
    waterPoints: {
      total: totalWaterPoints,
      available: availablePoints,
      maintenance: maintenancePoints,
      unavailable: unavailablePoints,
    },
    reports: {
      open: openReportsCount,
    },
    maintenance: {
      totalOpen: openRequests.length,
      byStatus: requestsByStatus,
      byPriority: requestsByPriority,
      completedCount: completedRequests.length,
      avgTimeToFixHours,
    },
  };
};

module.exports = {
  upsertFromReport,
  acknowledge,
  assign,
  updateStatus,
  verify,
  complete,
  getMaintenanceRequests,
  getMaintenanceRequestById,
  getAdminOverview,
};

