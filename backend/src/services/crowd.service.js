const mongoose = require("mongoose");
const Presence = require("../models/Presence");
const WaterPoint = require("../models/WaterPoint");
const crowdConfig = require("../config/crowd.config");

const levelFromPercentage = (p) => {
  if (p < crowdConfig.lowMaxPercent) return "LOW";
  if (p < crowdConfig.moderateMaxPercent) return "MODERATE";
  return "HIGH";
};

const getCrowdForAll = async () => {
  const waterPoints = await WaterPoint.find().lean();
  const now = new Date();

  // Aggregate active presences grouped by waterPointId
  const activePresences = await Presence.aggregate([
    {
      $match: {
        expiresAt: { $gt: now },
      },
    },
    {
      $group: {
        _id: "$waterPointId",
        count: { $sum: 1 },
      },
    },
  ]);

  const countsMap = new Map();
  for (const item of activePresences) {
    if (item._id) {
      countsMap.set(item._id.toString(), item.count);
    }
  }

  return waterPoints.map((wp) => {
    const wpIdStr = wp._id.toString();
    const count = countsMap.get(wpIdStr) || 0;
    const capacity = wp.capacity && wp.capacity > 0 ? wp.capacity : 10;
    const percentage = Math.min(100, Math.round((count / capacity) * 100));
    const level = levelFromPercentage(percentage);

    return {
      waterPointId: wp._id,
      count,
      capacity,
      percentage,
      level,
      estimated: true,
    };
  });
};

const getCrowdForOne = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw { status: 400, message: "Invalid water point ID format" };
  }

  const wp = await WaterPoint.findById(id).lean();
  if (!wp) {
    throw { status: 404, message: "Water point not found" };
  }

  const now = new Date();
  const count = await Presence.countDocuments({
    waterPointId: id,
    expiresAt: { $gt: now },
  });

  const capacity = wp.capacity && wp.capacity > 0 ? wp.capacity : 10;
  const percentage = Math.min(100, Math.round((count / capacity) * 100));
  const level = levelFromPercentage(percentage);

  return {
    waterPointId: wp._id,
    count,
    capacity,
    percentage,
    level,
    estimated: true,
  };
};

module.exports = {
  levelFromPercentage,
  getCrowdForAll,
  getCrowdForOne,
};
