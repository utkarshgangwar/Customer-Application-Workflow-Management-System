const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const globalErrorHandler = require("./middlewares/errorHandler");
const AppError = require("./utils/AppError");
const apiRouter = require("./routes");
const path = require("path");

const app = express();

// Trust reverse proxy (Required for Vercel, Render, or load balancers)
app.set("trust proxy", 1);

// General API Rate Limiter (100 requests per 15 minutes per IP)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message:
      "Too many requests from this IP, please try again after 15 minutes.",
  },
});

// Stricter Rate Limiter for Auth Routes (10 requests per 15 minutes)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message:
      "Too many authentication attempts, please try again after 15 minutes.",
  },
});

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
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app")
      ) {
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

// Health Check Endpoint (Unrestricted)
app.get("/ping", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Pong",
    timestamp: new Date().toISOString(),
  });
});

// Apply general rate limiting to all API routes
app.use("/api/v1", apiLimiter);

app.use("/api/v1/sync", require("./routes/syncRoutes"));

// Main API Routes
app.use("/api/v1", apiRouter);

// 404 Route Catch-All
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Centralized Error Handling Middleware
app.use(globalErrorHandler);

module.exports = app;
