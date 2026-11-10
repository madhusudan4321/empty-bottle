require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const healthRoutes = require("./routes/health.routes");
const authRoutes = require("./routes/auth.routes");
const waterPointRoutes = require("./routes/waterpoint.routes");

const app = express();

// CLIENT_URL can hold several URLs separated by commas
const defaultOrigins = [
  "http://localhost:3000",
  "https://empty-bottle.vercel.app",
];

const envOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((u) => u.trim())
  .filter(Boolean);

const allowedOrigins = [...defaultOrigins, ...envOrigins].map((u) =>
  u.replace(/\/+$/, "")
);

app.use(
  cors({
    origin: (origin, callback) => {
      // allow tools like curl/Postman (no origin) and listed origins
      if (!origin) return callback(null, true);

      const normalizedOrigin = origin.replace(/\/+$/, "");
      const isAllowed =
        allowedOrigins.includes(normalizedOrigin) ||
        /^https:\/\/empty-bottle[a-z0-9-]*\.vercel\.app$/.test(normalizedOrigin);

      if (isAllowed) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(express.json());

// ---- Feature routes ----
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/water-points", waterPointRoutes);
app.use("/api/reports", require("./routes/report.routes"));
app.use("/api/presence", require("./routes/presence.routes"));
app.use("/api/crowd", require("./routes/crowd.routes"));
app.use("/api/maintenance", require("./routes/maintenance.routes"));
app.use("/api/admin", require("./routes/admin.routes"));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.message);
  const status = err.status || (err.message === "Not allowed by CORS" ? 403 : 500);
  res.status(status).json({
    success: false,
    message: err.message || "Server error",
  });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
