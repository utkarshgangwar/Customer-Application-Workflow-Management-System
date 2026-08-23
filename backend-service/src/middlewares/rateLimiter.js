const rateLimit = require("express-rate-limit");

// General limiter for standard API routes (100 requests per 15 minutes)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: {
    status: 429,
    message:
      "Too many requests from this IP, please try again after 15 minutes.",
  },
});

// Stricter limiter for sensitive auth endpoints (10 requests per 15 minutes)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: "Too many login attempts, please try again after 15 minutes.",
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
};
