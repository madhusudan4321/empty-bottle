require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const healthRoutes = require("./routes/health.routes");

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

app.use("/api/health", healthRoutes);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
