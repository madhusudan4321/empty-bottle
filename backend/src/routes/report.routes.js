const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const {
  createReport,
  getMyReports,
} = require("../controllers/report.controller");

// All report routes require student authentication
router.post("/", protect, createReport);
router.get("/my", protect, getMyReports);

module.exports = router;
