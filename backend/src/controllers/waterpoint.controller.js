const waterPointService = require("../services/waterpoint.service");

// GET /api/water-points
const getAllWaterPoints = async (req, res) => {
  try {
    const waterPoints = await waterPointService.getAllWaterPoints();
    res.json({ success: true, data: waterPoints });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({
      success: false,
      message: error.message || "Failed to retrieve water points",
    });
  }
};

// GET /api/water-points/:id
const getWaterPointById = async (req, res) => {
  try {
    const waterPoint = await waterPointService.getWaterPointById(req.params.id);
    res.json({ success: true, data: waterPoint });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({
      success: false,
      message: error.message || "Failed to retrieve water point",
    });
  }
};

// POST /api/water-points
const createWaterPoint = async (req, res) => {
  try {
    const waterPoint = await waterPointService.createWaterPoint(req.body);
    res.status(201).json({ success: true, data: waterPoint });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({
      success: false,
      message: error.message || "Failed to create water point",
    });
  }
};

// PUT /api/water-points/:id
const updateWaterPoint = async (req, res) => {
  try {
    const updated = await waterPointService.updateWaterPoint(req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({
      success: false,
      message: error.message || "Failed to update water point",
    });
  }
};

// DELETE /api/water-points/:id
const deleteWaterPoint = async (req, res) => {
  try {
    const result = await waterPointService.deleteWaterPoint(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({
      success: false,
      message: error.message || "Failed to delete water point",
    });
  }
};

module.exports = {
  getAllWaterPoints,
  getWaterPointById,
  createWaterPoint,
  updateWaterPoint,
  deleteWaterPoint,
};

