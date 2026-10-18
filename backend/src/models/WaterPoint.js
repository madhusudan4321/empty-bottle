const mongoose = require("mongoose");

const waterPointSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  latitude: { type: Number, required: true, min: -90, max: 90 },
  longitude: { type: Number, required: true, min: -180, max: 180 },
  capacity: { type: Number, default: 10, min: 1 },
  crowdRadius: { type: Number, default: 50, min: 5 }, // metres
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
