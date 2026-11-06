const mongoose = require("mongoose");
const Presence = require("../models/Presence");
const WaterPoint = require("../models/WaterPoint");
const crowdConfig = require("../config/crowd.config");
const crowdService = require("../services/crowd.service");

// Helper to handle enter and ping
const handleEnterOrPing = async (req, res, next) => {
  try {
    const { waterPointId } = req.body || {};

    if (!waterPointId) {
      return res.status(400).json({
        success: false,
        message: "waterPointId is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(waterPointId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid water point ID format",
      });
    }

    const waterPoint = await WaterPoint.findById(waterPointId).lean();
    if (!waterPoint) {
      return res.status(404).json({
        success: false,
        message: "Water point not found",
      });
    }

    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + crowdConfig.presenceTtlSeconds * 1000
    );

    // Upsert the single active presence for this user
    await Presence.findOneAndUpdate(
      { userId: req.user._id },
      {
        waterPointId,
        detectedAt: now,
        expiresAt,
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );

    const crowd = await crowdService.getCrowdForOne(waterPointId);

    return res.status(200).json({
      success: true,
      data: crowd,
    });
  } catch (error) {
    next(error);
  }
};

const enter = async (req, res, next) => {
  return handleEnterOrPing(req, res, next);
};

const ping = async (req, res, next) => {
  return handleEnterOrPing(req, res, next);
};

const leave = async (req, res, next) => {
  try {
    await Presence.deleteOne({ userId: req.user._id });
    return res.status(200).json({
      success: true,
      data: { left: true },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  enter,
  ping,
  leave,
};
