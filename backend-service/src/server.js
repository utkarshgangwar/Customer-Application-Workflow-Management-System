const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const globalErrorHandler = require("./middlewares/errorHandler");
const AppError = require("./utils/AppError");
const apiRouter = require("./routes");
const path = require("path");
const { startSyncWorker } = require("./services/syncService");

const app = express();

// Security HTTP Headers
app.use(helmet());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// CORS Policy
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  process.env.CLIENT_URL ? process.env.CLIENT_URL.replace(/\/$/, "") : null,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-side fetch)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Blocked by CORS policy"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Body Parsers
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Development Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Health Check Endpoint
app.get("/ping", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Pong",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/v1/sync", require("./routes/syncRoutes"));

// Routes
app.use("/api/v1", apiRouter);

// 404 Route Catch-All
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Centralized Error Handling Middleware
app.use(globalErrorHandler);

module.exports = app;
