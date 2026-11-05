const mongoose = require("mongoose");

const waterPointSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  building: { type: String, trim: true, maxlength: 100 },
  floor: { type: String, trim: true, maxlength: 50 },
  landmark: { type: String, trim: true, maxlength: 200 },
  latitude: { type: Number, required: true, min: -90, max: 90 },
  longitude: { type: Number, required: true, min: -180, max: 180 },
  capacity: { type: Number, default: 10, min: 1 },
  crowdRadius: { type: Number, default: 30, min: 10 }, // metres
  availability: {
    type: String,
    enum: ["available", "unavailable", "maintenance"],
    default: "available",
  },
  temperature: {
    type: String,
    enum: ["cold", "cool", "normal", "warm"],
    default: "normal",
  },
  cleanliness: {
    type: String,
    enum: ["clean", "average", "dirty"],
    default: "clean",
  },
  lastUpdated: { type: Date, default: Date.now },
});

module.exports = mongoose.model("WaterPoint", waterPointSchema);
