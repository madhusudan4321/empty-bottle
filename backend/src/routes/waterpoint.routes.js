const express = require("express");
const router = express.Router();
const waterPointController = require("../controllers/waterpoint.controller");
const { protect, authorizeRoles } = require("../middleware/auth.middleware");

// GET /api/water-points (any logged-in user)
router.get("/", protect, waterPointController.getAllWaterPoints);

// GET /api/water-points/:id (any logged-in user)
router.get("/:id", protect, waterPointController.getWaterPointById);

// POST /api/water-points (admin only)
router.post(
  "/",
  protect,
  authorizeRoles("admin"),
  waterPointController.createWaterPoint
);

// PUT /api/water-points/:id (admin only)
router.put(
  "/:id",
  protect,
  authorizeRoles("admin"),
  waterPointController.updateWaterPoint
);

// DELETE /api/water-points/:id (admin only)
router.delete(
  "/:id",
  protect,
  authorizeRoles("admin"),
  waterPointController.deleteWaterPoint
);

module.exports = router;

