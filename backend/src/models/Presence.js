const mongoose = require("mongoose");

const presenceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true, // one active presence per user
  },
  waterPointId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "WaterPoint",
    required: true,
    index: true,
  },
  detectedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
});

// MongoDB removes the document automatically when expiresAt is reached
presenceSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Presence", presenceSchema);
