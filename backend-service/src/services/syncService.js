const {
  SyncJob,
  CustomerApplication,
  WorkItem,
  Activity,
  Document,
} = require("../models");

// Mock external CRM / Consular Gateway HTTP dispatcher
const pushToExternalSystem = async (applicationData) => {
  // Simulate network call latency
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Simulating 5% transient network failure for retry resilience testing
  if (Math.random() < 0.05) {
    throw new Error(
      "External Gateway Timeout (HTTP 504) - Downstream unavailable",
    );
  }

  return {
    remoteId: `EXT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    status: "SYNC_ACKNOWLEDGED",
    syncedAt: new Date().toISOString(),
  };
};

// Process a single job with locking & idempotency
const processJob = async (job) => {
  const application = await CustomerApplication.findById(job.applicationId)
    .populate("customerId")
    .populate("workflowId")
    .populate("assignedTo", "name email");

  if (!application) {
    job.state = "FAILED";
    job.errorMessage = "Target Application docket not found.";
    await job.save();
    return;
  }

  // Aggregate dossier payload
  const workItems = await WorkItem.find({
    applicationId: application._id,
  }).populate("attachmentId");

  const syncPayload = {
    idempotencyKey: job.idempotencyKey,
    docketId: application._id,
    title: application.title,
    currentStage: application.currentStage,
    status: application.status,
    customer: {
      id: application.customerId?._id,
      name: application.customerId?.name,
      email: application.customerId?.email,
      mobile: application.customerId?.mobile,
      city: application.customerId?.city,
    },
    tasksCompleted: workItems.map((w) => ({
      title: w.title,
      stage: w.stageName,
      status: w.status,
      attachmentUrl: w.attachmentId?.fileUrl || null,
    })),
  };

  try {
    const remoteResponse = await pushToExternalSystem(syncPayload);

    job.state = "COMPLETED";
    job.payload = syncPayload;
    job.response = remoteResponse;
    job.errorMessage = null;
    await job.save();

    await Activity.create({
      applicationId: application._id,
      actionType: "EXTERNAL_SYNC_TRIGGERED",
      message: `External synchronization completed successfully. Remote ID: ${remoteResponse.remoteId}`,
      metadata: {
        remoteId: remoteResponse.remoteId,
        idempotencyKey: job.idempotencyKey,
      },
    });

    console.log(
      `[SYNC ENGINE] Job ${job._id} synchronized successfully for Docket ${application._id}`,
    );
  } catch (error) {
    job.attempts += 1;
    job.lastAttemptAt = new Date();
    job.errorMessage = error.message;

    if (job.attempts >= job.maxRetries) {
      job.state = "FAILED";
      console.error(
        `[SYNC ENGINE] Job ${job._id} permanently failed after ${job.attempts} attempts.`,
      );

      await Activity.create({
        applicationId: application._id,
        actionType: "STATUS_UPDATED",
        message: `External synchronization failed: ${error.message}`,
        metadata: { attempts: job.attempts, error: error.message },
      });
    } else {
      job.state = "PENDING";
      // Exponential backoff: 30s * 2^(attempts-1)
      const delayMs = 30000 * Math.pow(2, job.attempts - 1);
      job.nextRetryAt = new Date(Date.now() + delayMs);
      console.warn(
        `[SYNC ENGINE] Job ${job._id} failed. Retrying in ${delayMs / 1000}s...`,
      );
    }

    await job.save();
  }
};

// Batch processor loop
const runSyncWorkerBatch = async () => {
  try {
    // Atomically find and lock eligible pending jobs
    const eligibleJobs = await SyncJob.find({
      state: "PENDING",
      nextRetryAt: { $lte: new Date() },
    }).limit(5);

    for (const job of eligibleJobs) {
      // Optimistic lock
      job.state = "PROCESSING";
      job.lastAttemptAt = new Date();
      await job.save();

      await processJob(job);
    }
  } catch (err) {
    console.error("[SYNC ENGINE] Error running batch worker:", err);
  }
};

// Initialize background poller
let workerInterval = null;

const startSyncWorker = (intervalMs = 15000) => {
  if (workerInterval) return;
  console.log(
    `[SYNC ENGINE] Background worker initialized (Polling every ${intervalMs / 1000}s)`,
  );
  workerInterval = setInterval(runSyncWorkerBatch, intervalMs);
};

module.exports = {
  startSyncWorker,
  runSyncWorkerBatch,
  processJob,
};
