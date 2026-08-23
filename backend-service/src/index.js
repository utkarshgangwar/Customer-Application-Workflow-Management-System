require("dotenv").config();
const app = require("./server");
const connectDB = require("./config/db");
const { startSyncWorker } = require("./services/syncService");

// Handle Uncaught Synchronous Exceptions
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;

let server;

// Start Server after connecting to Database
connectDB()
  .then(() => {
    server = app.listen(PORT, () => {
      console.log(
        `🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`,
      );

      // Start background sync polling daemon (polls every 10 seconds)
      startSyncWorker(10000);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database connection:", err.message);
    process.exit(1);
  });

// Handle Asynchronous Unhandled Promise Rejections
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION! 💥 Shutting down gracefully...");
  console.error(err.name, err.message);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Graceful Termination Signals (Docker / PM2 / Kubernetes / Nodemon)
const gracefulShutdown = () => {
  console.log("👋 Termination signal received. Shutting down gracefully...");
  if (server) {
    server.close(() => {
      console.log("💥 HTTP server closed.");
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);
