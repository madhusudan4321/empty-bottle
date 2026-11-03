const mongoose = require("mongoose");

const maintenanceRequestSchema = new mongoose.Schema(
  {
    waterPointId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WaterPoint",
      required: true,
    },
    issue: { type: String, required: true, trim: true },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "low",
    },
    assignedStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: [
        "reported",
        "acknowledged",
        "assigned",
        "in_progress",
        "fixed",
        "verified",
        "available",
      ],
      default: "reported",
    },
    completedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model("MaintenanceRequest", maintenanceRequestSchema);
