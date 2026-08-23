const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { SyncJob } = require("../models");
const { processJob } = require("../services/syncService");

// Get all sync jobs for an application docket
exports.getApplicationSyncJobs = asyncHandler(async (req, res, next) => {
  const jobs = await SyncJob.find({
    applicationId: req.params.applicationId,
  }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    results: jobs.length,
    data: jobs,
  });
});

// Retry a failed sync job manually
exports.retrySyncJob = asyncHandler(async (req, res, next) => {
  const job = await SyncJob.findById(req.params.id);
  if (!job) return next(new AppError("Sync job record not found.", 404));

  job.state = "PROCESSING";
  job.errorMessage = null;
  await job.save();

  // Run immediately
  processJob(job);

  res.status(200).json({
    success: true,
    message: "Sync job queued for immediate execution.",
    data: job,
  });
});
