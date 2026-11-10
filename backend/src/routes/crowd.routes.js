const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const crowdController = require("../controllers/crowd.controller");

router.use(protect);

// Prevent caching crowd status so clients always get fresh counts
router.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

router.get("/", crowdController.getAll);
router.get("/:waterPointId", crowdController.getOne);

module.exports = router;
