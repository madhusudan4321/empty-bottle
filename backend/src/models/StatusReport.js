const mongoose = require("mongoose");

const statusReportSchema = new mongoose.Schema(
  {
    waterPointId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WaterPoint",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    issueType: {
      type: String,
      enum: [
        "water_unavailable",
        "water_warm",
        "dirty",
        "tap_damaged",
        "leakage",
        "cooler_not_working",
        "other",
      ],
      required: true,
    },
    description: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["open", "in_review", "resolved"],
      default: "open",
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

statusReportSchema.index({ waterPointId: 1, issueType: 1 });

module.exports = mongoose.model("StatusReport", statusReportSchema);
