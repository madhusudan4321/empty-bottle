const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const presenceController = require("../controllers/presence.controller");

// Reject/strip any coordinates in request body to enforce privacy
const stripCoordinates = (req, res, next) => {
  if (req.body) {
    delete req.body.latitude;
    delete req.body.longitude;
    delete req.body.lat;
    delete req.body.lng;
    delete req.body.coords;
  }
  next();
};

router.use(protect);
router.use(stripCoordinates);

router.post("/enter", presenceController.enter);
router.post("/ping", presenceController.ping);
router.post("/leave", presenceController.leave);

module.exports = router;
