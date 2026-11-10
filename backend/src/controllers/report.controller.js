const mongoose = require("mongoose");
const StatusReport = require("../models/StatusReport");
const WaterPoint = require("../models/WaterPoint");
const maintenanceService = require("../services/maintenance.service");

const ALLOWED_ISSUE_TYPES = [
  "water_unavailable",
  "water_warm",
  "dirty",
  "tap_damaged",
  "leakage",
  "cooler_not_working",
  "other",
];

// POST /api/reports
// Creates a new problem report filed by the authenticated student
const createReport = async (req, res) => {
  try {
    const { waterPointId, issueType, description } = req.body;

    // 1. Validate issueType against allowed enum list
    if (!issueType || !ALLOWED_ISSUE_TYPES.includes(issueType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid or missing issueType. Allowed values: ${ALLOWED_ISSUE_TYPES.join(", ")}`,
      });
    }

    // 2. Validate waterPointId is a valid ObjectId
    if (!waterPointId || !mongoose.Types.ObjectId.isValid(waterPointId)) {
      return res.status(400).json({
        success: false,
        message: "A valid waterPointId is required",
      });
    }

    // 3. Verify that the water point actually exists in the database
    const waterPointExists = await WaterPoint.findById(waterPointId);
    if (!waterPointExists) {
      return res.status(404).json({
        success: false,
        message: "Water point not found",
      });
    }

    // 4. Sanitize and validate description (max 1000 chars)
    let sanitizedDescription = "";
    if (description && typeof description === "string") {
      sanitizedDescription = description.trim();
      if (sanitizedDescription.length > 1000) {
        return res.status(400).json({
          success: false,
          message: "Description must not exceed 1000 characters",
        });
      }
    }

    // 5. Create report: userId taken ONLY from req.user._id, status defaults to "open"
    const report = await StatusReport.create({
      waterPointId,
      userId: req.user._id,
      issueType,
      description: sanitizedDescription,
      status: "open",
    });

    // Link to maintenance workflow
    try {
      await maintenanceService.upsertFromReport(report);
    } catch (mErr) {
      console.error("Error linking report to maintenance request:", mErr);
    }

    const populatedReport = await StatusReport.findById(report._id).populate(
      "waterPointId",
      "name"
    );

    return res.status(201).json({
      success: true,
      data: populatedReport,
    });
  } catch (error) {
    console.error("Error creating status report:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while creating report",
    });
  }
};

// GET /api/reports/my
// Returns all reports created by the currently authenticated student
const getMyReports = async (req, res) => {
  try {
    const reports = await StatusReport.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate("waterPointId", "name");

    return res.status(200).json({
      success: true,
      data: reports,
    });
  } catch (error) {
    console.error("Error retrieving user reports:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while retrieving reports",
    });
  }
};

module.exports = {
  createReport,
  getMyReports,
};
