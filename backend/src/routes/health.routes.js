const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    success: true,
    data: {
      status: "ok",
      database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
    },
  });
});

module.exports = router;
