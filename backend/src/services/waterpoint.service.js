const mongoose = require("mongoose");
const WaterPoint = require("../models/WaterPoint");
const MaintenanceRequest = require("../models/MaintenanceRequest");

const VALID_AVAILABILITY = ["available", "unavailable", "maintenance"];
const VALID_TEMPERATURE = ["cold", "cool", "normal", "warm"];
const VALID_CLEANLINESS = ["clean", "average", "dirty"];

const WHITELISTED_UPDATE_FIELDS = [
  "name",
  "latitude",
  "longitude",
  "capacity",
  "crowdRadius",
  "availability",
  "temperature",
  "cleanliness",
];

const validateCoordinates = (latitude, longitude) => {
  if (typeof latitude !== "number" || isNaN(latitude) || latitude < -90 || latitude > 90) {
    throw { status: 400, message: "Latitude must be a number between -90 and 90" };
  }
  if (typeof longitude !== "number" || isNaN(longitude) || longitude < -180 || longitude > 180) {
    throw { status: 400, message: "Longitude must be a number between -180 and 180" };
  }
};

const validateNumericPositive = (value, fieldName) => {
  if (value !== undefined && (typeof value !== "number" || isNaN(value) || value <= 0)) {
    throw { status: 400, message: `${fieldName} must be a positive number` };
  }
};

const validateEnums = ({ availability, temperature, cleanliness }) => {
  if (availability !== undefined && !VALID_AVAILABILITY.includes(availability)) {
    throw {
      status: 400,
      message: `Invalid availability. Must be one of: ${VALID_AVAILABILITY.join(", ")}`,
    };
  }
  if (temperature !== undefined && !VALID_TEMPERATURE.includes(temperature)) {
    throw {
      status: 400,
      message: `Invalid temperature. Must be one of: ${VALID_TEMPERATURE.join(", ")}`,
    };
  }
  if (cleanliness !== undefined && !VALID_CLEANLINESS.includes(cleanliness)) {
    throw {
      status: 400,
      message: `Invalid cleanliness. Must be one of: ${VALID_CLEANLINESS.join(", ")}`,
    };
  }
};

const getAllWaterPoints = async () => {
  return await WaterPoint.find().sort({ name: 1 });
};

const getWaterPointById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw { status: 400, message: "Invalid water point ID format" };
  }
  const waterPoint = await WaterPoint.findById(id);
  if (!waterPoint) {
    throw { status: 404, message: "Water point not found" };
  }
  return waterPoint;
};

const createWaterPoint = async (data) => {
  const {
    name,
    latitude,
    longitude,
    capacity,
    crowdRadius,
    availability,
    temperature,
    cleanliness,
  } = data;

  if (!name || typeof name !== "string" || !name.trim()) {
    throw { status: 400, message: "Water point name is required" };
  }

  validateCoordinates(latitude, longitude);
  validateNumericPositive(capacity, "Capacity");
  validateNumericPositive(crowdRadius, "Crowd radius");
  validateEnums({ availability, temperature, cleanliness });

  const payload = {
    name: name.trim(),
    latitude,
    longitude,
    lastUpdated: new Date(),
  };

  if (capacity !== undefined) payload.capacity = capacity;
  if (crowdRadius !== undefined) payload.crowdRadius = crowdRadius;
  if (availability !== undefined) payload.availability = availability;
  if (temperature !== undefined) payload.temperature = temperature;
  if (cleanliness !== undefined) payload.cleanliness = cleanliness;

  return await WaterPoint.create(payload);
};

const updateWaterPoint = async (id, data) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw { status: 400, message: "Invalid water point ID format" };
  }

  const waterPoint = await WaterPoint.findById(id);
  if (!waterPoint) {
    throw { status: 404, message: "Water point not found" };
  }

  // Filter only whitelisted fields
  const updates = {};
  for (const field of WHITELISTED_UPDATE_FIELDS) {
    if (data[field] !== undefined) {
      updates[field] = data[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    throw { status: 400, message: "No valid fields provided for update" };
  }

  if (updates.name !== undefined) {
    if (typeof updates.name !== "string" || !updates.name.trim()) {
      throw { status: 400, message: "Water point name cannot be empty" };
    }
    updates.name = updates.name.trim();
  }

  if (updates.latitude !== undefined || updates.longitude !== undefined) {
    const lat = updates.latitude !== undefined ? updates.latitude : waterPoint.latitude;
    const lng = updates.longitude !== undefined ? updates.longitude : waterPoint.longitude;
    validateCoordinates(lat, lng);
  }

  if (updates.capacity !== undefined) {
    validateNumericPositive(updates.capacity, "Capacity");
  }

  if (updates.crowdRadius !== undefined) {
    validateNumericPositive(updates.crowdRadius, "Crowd radius");
  }

  validateEnums({
    availability: updates.availability,
    temperature: updates.temperature,
    cleanliness: updates.cleanliness,
  });

  updates.lastUpdated = new Date();

  return await WaterPoint.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });
};

const deleteWaterPoint = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw { status: 400, message: "Invalid water point ID format" };
  }

  const waterPoint = await WaterPoint.findById(id);
  if (!waterPoint) {
    throw { status: 404, message: "Water point not found" };
  }

  // Block deletion if any open maintenance requests exist
  const openRequests = await MaintenanceRequest.find({
    waterPointId: id,
    status: { $ne: "available" },
  });

  if (openRequests && openRequests.length > 0) {
    throw {
      status: 409,
      message: "Cannot delete water point with active maintenance requests",
    };
  }

  await WaterPoint.findByIdAndDelete(id);
  return { message: "Water point deleted successfully" };
};

module.exports = {
  getAllWaterPoints,
  getWaterPointById,
  createWaterPoint,
  updateWaterPoint,
  deleteWaterPoint,
};

