const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const crowdController = require("../controllers/crowd.controller");

router.use(protect);

router.get("/", crowdController.getAll);
router.get("/:waterPointId", crowdController.getOne);

module.exports = router;
