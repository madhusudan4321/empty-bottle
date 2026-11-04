require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const healthRoutes = require("./routes/health.routes");
const authRoutes = require("./routes/auth.routes");
const waterPointRoutes = require("./routes/waterpoint.routes");

const app = express();

// CLIENT_URL can hold several URLs separated by commas
const allowedOrigins = [
  "http://localhost:3000",
  ...(process.env.CLIENT_URL || "").split(",").map((u) => u.trim()).filter(Boolean),
];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow tools like curl/Postman (no origin) and listed origins
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// ---- Lead routes ----
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
