const express = require("express");
const router = express.Router();
const { protect, authorizeRoles } = require("../middleware/auth.middleware");
const maintenanceController = require("../controllers/maintenance.controller");

router.use(protect);

router.get(
  "/",
  authorizeRoles("admin", "staff"),
  maintenanceController.getMaintenanceRequests
);

router.get(
  "/:id",
  authorizeRoles("admin", "staff"),
  maintenanceController.getMaintenanceRequestById
);

router.put(
  "/:id/acknowledge",
  authorizeRoles("admin"),
  maintenanceController.acknowledge
);

router.put(
  "/:id/assign",
  authorizeRoles("admin"),
  maintenanceController.assign
);

router.put(
  "/:id/status",
  authorizeRoles("admin", "staff"),
  maintenanceController.updateStatus
);

router.put(
  "/:id/verify",
  authorizeRoles("admin"),
  maintenanceController.verify
);

router.put(
  "/:id/complete",
  authorizeRoles("admin"),
  maintenanceController.complete
);

module.exports = router;

