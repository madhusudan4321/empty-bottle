const express = require("express");
const router = express.Router();
const { protect, authorizeRoles } = require("../middleware/auth.middleware");
const adminController = require("../controllers/admin.controller");

router.use(protect);

// Admin & Staff can view reports
router.get(
  "/reports",
  authorizeRoles("admin", "staff"),
  adminController.getAdminReports
);

// Admin only routes
router.get(
  "/staff",
  authorizeRoles("admin"),
  adminController.getStaffList
);

router.post(
  "/staff",
  authorizeRoles("admin"),
  adminController.createStaff
);

router.put(
  "/staff/:id/active",
  authorizeRoles("admin"),
  adminController.setStaffActiveStatus
);

router.get(
  "/overview",
  authorizeRoles("admin"),
  adminController.getOverview
);

module.exports = router;

