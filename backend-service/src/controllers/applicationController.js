const crypto = require("crypto");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const {
  CustomerApplication,
  Workflow,
  Activity,
  SyncJob,
  User,
  WorkItem,
  Customer,
} = require("../models");

// Helper: Provision work items specifically for a target stage (Idempotent & Re-opening aware)
const syncStageWorkItems = async (application, stageConfig, assignedTo) => {
  if (!stageConfig) return;

  const stageTasks = stageConfig.work || stageConfig.workRequired || [];
  if (!Array.isArray(stageTasks) || stageTasks.length === 0) return;

  const stageNum = stageConfig.orderNumber ?? stageConfig.order_number ?? 1;

  // 1. Check if tasks for this stage were already created in the past
  const existingItems = await WorkItem.find({
    applicationId: application._id,
    stageName: stageConfig.name,
  });

  if (existingItems.length > 0) {
    // If sent BACKWARD to a stage, reset previously completed tasks to PENDING
    await WorkItem.updateMany(
      { applicationId: application._id, stageName: stageConfig.name },
      { $set: { status: "PENDING", completedAt: null } },
    );
    return;
  }

  // 2. If visiting this stage for the first time, generate tasks for this stage only
  const newWorkItems = stageTasks.map((w) => {
    const taskTitle =
      (typeof w === "string" ? w : w.name || w.title || w.workType) ||
      "Stage Task";

    return {
      applicationId: application._id,
      stageName: stageConfig.name,
      stageOrderNumber: stageNum,
      title: taskTitle,
      description: `Task required during ${stageConfig.name} stage.`,
      assignedTo: assignedTo || application.assignedTo || null,
      status: "PENDING",
    };
  });

  await WorkItem.insertMany(newWorkItems);
};

// 1. Create New Application (Guarded by Workflow Domain Group)
exports.createApplication = asyncHandler(async (req, res, next) => {
  const { customerId, workflowId, title, priority, assignedTo } = req.body;

  const workflow = await Workflow.findById(workflowId);
  if (!workflow) {
    return next(new AppError("Invalid workflow template specified.", 404));
  }

  // Domain Verification for Assignee:
  let designatedAssignee = assignedTo || null;
  let designatedManager = req.user.role === "manager" ? req.user._id : null;

  if (designatedAssignee) {
    const targetUser = await User.findById(designatedAssignee);
    if (!targetUser) {
      return next(new AppError("Assigned staff member not found.", 404));
    }

    // Verify staff belongs to workflow group (teamId match, universal workflow, or universal staff)
    if (
      workflow.teamId &&
      targetUser.teamId &&
      targetUser.teamId.toString() !== workflow.teamId.toString() &&
      !workflow.isUniversal
    ) {
      return next(
        new AppError(
          "The assigned staff member does not belong to this workflow's domain group.",
          400,
        ),
      );
    }
  } else {
    // Auto-assign: pick available executive in the workflow's domain unit
    if (workflow.teamId) {
      const teamExecutive = await User.findOne({
        teamId: workflow.teamId,
        role: "executive",
        active: true,
      });
      if (teamExecutive) designatedAssignee = teamExecutive._id;
    }

    if (!designatedAssignee) {
      const universalExec = await User.findOne({
        role: "executive",
        active: true,
      });
      if (universalExec) designatedAssignee = universalExec._id;
    }
  }

  // Resolve Stage 1
  const rawStages = workflow.stages || [];
  const sortedStages = [...rawStages].sort((a, b) => {
    const orderA = a.orderNumber ?? a.order_number ?? 0;
    const orderB = b.orderNumber ?? b.order_number ?? 0;
    return orderA - orderB;
  });

  const initialStage = sortedStages[0];
  const stageName = initialStage ? initialStage.name : "STAGE_1";

  // Create Application
  const application = await CustomerApplication.create({
    customerId,
    workflowId,
    title,
    priority: priority ?? 1,
    currentStage: stageName,
    status: "ACTIVE",
    assignedTo: designatedAssignee,
    managerId: designatedManager,
    version: 1,
  });

  // Provision Initial Stage Work Items
  if (initialStage) {
    await syncStageWorkItems(application, initialStage, designatedAssignee);
  }

  // Audit Log
  await Activity.create({
    applicationId: application._id,
    performedBy: req.user._id,
    actionType: "APPLICATION_CREATED",
    message: `Application docket created at stage: ${stageName}. Initialized tasks for ${stageName}.`,
    metadata: {
      stage: stageName,
      status: "ACTIVE",
      assignedTo: designatedAssignee,
    },
  });

  res.status(201).json({ success: true, data: application });
});

// 2. List/Filter Applications with Domain Scoping
exports.getAllApplications = asyncHandler(async (req, res, next) => {
  const { search, page = 1, limit = 8 } = req.query;
  const parsedPage = parseInt(page, 10) || 1;
  const parsedLimit = parseInt(limit, 10) || 8;
  const skip = (parsedPage - 1) * parsedLimit;

  const andConditions = [];

  // Domain Scoping for Non-Admins:
  // Managers & Executives only see applications belonging to their domain group workflows
  if (req.user.role !== "admin") {
    let allowedWorkflowFilter = { active: { $ne: false } };

    if (req.user.teamId) {
      allowedWorkflowFilter.$or = [
        { teamId: req.user.teamId },
        { teamId: null },
        { isUniversal: true },
      ];
    } else {
      allowedWorkflowFilter.$or = [{ teamId: null }, { isUniversal: true }];
    }

    const accessibleWorkflows = await Workflow.find(
      allowedWorkflowFilter,
    ).select("_id");
    const allowedWfIds = accessibleWorkflows.map((w) => w._id);

    andConditions.push({ workflowId: { $in: allowedWfIds } });
  }

  // Search Condition
  if (search && search.trim()) {
    const searchRegex = { $regex: search.trim(), $options: "i" };

    const matchingCustomers = await Customer.find({
      $or: [{ name: searchRegex }, { email: searchRegex }],
    }).select("_id");

    const customerIds = matchingCustomers.map((c) => c._id);

    andConditions.push({
      $or: [
        { title: searchRegex },
        { currentStage: searchRegex },
        { customerId: { $in: customerIds } },
      ],
    });
  }

  const filter =
    andConditions.length > 0
      ? andConditions.length === 1
        ? andConditions[0]
        : { $and: andConditions }
      : {};

  const [applications, total] = await Promise.all([
    CustomerApplication.find(filter)
      .populate("customerId", "name email mobile")
      .populate("assignedTo", "name email role")
      .populate("workflowId", "name teamId isUniversal")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit),
    CustomerApplication.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    results: applications.length,
    pagination: {
      total,
      page: parsedPage,
      limit: parsedLimit,
      pages: Math.ceil(total / parsedLimit) || 1,
    },
    data: applications,
  });
});

// 3. Get Single Application
exports.getApplicationById = asyncHandler(async (req, res, next) => {
  const application = await CustomerApplication.findById(req.params.id)
    .populate("customerId")
    .populate("assignedTo", "name email role")
    .populate("managerId", "name email")
    .populate("workflowId");

  if (!application) return next(new AppError("Application not found.", 404));
  res.status(200).json({ success: true, data: application });
});

// 4. Update Application Stage
exports.updateApplicationStage = asyncHandler(async (req, res, next) => {
  const { newStage, version, remarks } = req.body;
  const application = await CustomerApplication.findById(req.params.id);

  if (!application) return next(new AppError("Application not found.", 404));

  if (["CANCELLED", "COMPLETED"].includes(application.status)) {
    return next(
      new AppError(
        `Cannot change stage of a ${application.status} application.`,
        400,
      ),
    );
  }

  if (version !== undefined && application.version !== version) {
    return next(
      new AppError(
        "Application was modified by another user. Refresh and retry.",
        409,
      ),
    );
  }

  const workflow = await Workflow.findById(application.workflowId);
  if (!workflow) {
    return next(new AppError("Associated workflow template not found.", 404));
  }

  const currentStageNameNormalized = application.currentStage
    .trim()
    .toUpperCase();
  const currentStageConfig = workflow.stages.find(
    (s) => s.name.trim().toUpperCase() === currentStageNameNormalized,
  );

  if (currentStageConfig && currentStageConfig.allowedTransitions) {
    const allowedNormalized = currentStageConfig.allowedTransitions.map((t) =>
      t.trim().toUpperCase(),
    );
    const targetStageNormalized = newStage.trim().toUpperCase();

    if (!allowedNormalized.includes(targetStageNormalized)) {
      return next(
        new AppError(
          `Invalid transition from "${application.currentStage}" to "${newStage}". Allowed: ${currentStageConfig.allowedTransitions.join(", ")}`,
          400,
        ),
      );
    }
  }

  // Check stage task completion
  if (newStage.trim().toUpperCase() !== currentStageNameNormalized) {
    const pendingTasks = await WorkItem.find({
      applicationId: application._id,
      stageName: application.currentStage,
      status: { $ne: "COMPLETED" },
    });

    if (pendingTasks.length > 0) {
      const pendingNames = pendingTasks.map((t) => `"${t.title}"`).join(", ");
      return next(
        new AppError(
          `Cannot advance stage. Please complete all pending tasks for "${application.currentStage}": ${pendingNames}`,
          400,
        ),
      );
    }
  }

  const previousStage = application.currentStage;
  application.currentStage = newStage;
  application.version += 1;

  if (newStage.trim().toUpperCase() === "COMPLETED") {
    application.status = "COMPLETED";

    const idempotencyKey = crypto
      .createHash("sha256")
      .update(`${application._id}-${new Date().toISOString()}`)
      .digest("hex");

    await SyncJob.create({
      applicationId: application._id,
      idempotencyKey,
      state: "PENDING",
    });

    await Activity.create({
      applicationId: application._id,
      performedBy: req.user._id,
      actionType: "EXTERNAL_SYNC_TRIGGERED",
      message:
        "Application marked completed and queued for external synchronization.",
      metadata: { idempotencyKey, remarks: remarks || "" },
    });
  } else {
    const targetStageConfig = workflow.stages.find(
      (s) => s.name.trim().toUpperCase() === newStage.trim().toUpperCase(),
    );
    if (targetStageConfig) {
      await syncStageWorkItems(
        application,
        targetStageConfig,
        application.assignedTo,
      );
    }
  }

  await application.save();

  const formattedMessage = remarks?.trim()
    ? `Stage moved from ${previousStage} to ${newStage}. Remarks: ${remarks.trim()}`
    : `Stage moved from ${previousStage} to ${newStage}`;

  await Activity.create({
    applicationId: application._id,
    performedBy: req.user._id,
    actionType: "STAGE_UPDATED",
    message: formattedMessage,
    metadata: { previousStage, newStage, remarks: remarks?.trim() || "" },
  });

  res.status(200).json({ success: true, data: application });
});

// 5. Update Operational Status
exports.updateApplicationStatus = asyncHandler(async (req, res, next) => {
  const { status, reason, version } = req.body;
  const application = await CustomerApplication.findById(req.params.id);

  if (!application) return next(new AppError("Application not found.", 404));

  if (version !== undefined && application.version !== version) {
    return next(
      new AppError(
        "Conflict detected: Application was updated elsewhere.",
        409,
      ),
    );
  }

  const prevStatus = application.status;
  application.status = status;
  application.version += 1;

  await application.save();

  await Activity.create({
    applicationId: application._id,
    performedBy: req.user._id,
    actionType: "STATUS_UPDATED",
    message: `Status updated from ${prevStatus} to ${status}. Reason: ${reason || "N/A"}`,
    metadata: { prevStatus, newStatus: status, reason },
  });

  res.status(200).json({ success: true, data: application });
});

// 6. Assign / Reassign Staff (Validates domain group on manual reassignment)
exports.assignApplication = asyncHandler(async (req, res, next) => {
  const { assignedTo, managerId } = req.body;
  const application = await CustomerApplication.findById(
    req.params.id,
  ).populate("workflowId");

  if (!application) return next(new AppError("Application not found.", 404));

  if (assignedTo) {
    const targetUser = await User.findById(assignedTo);
    if (!targetUser) return next(new AppError("Staff member not found.", 404));

    if (
      application.workflowId?.teamId &&
      targetUser.teamId &&
      targetUser.teamId.toString() !==
        application.workflowId.teamId.toString() &&
      !application.workflowId.isUniversal
    ) {
      return next(
        new AppError(
          "The staff member does not belong to this application's workflow domain group.",
          400,
        ),
      );
    }
  }

  const prevAssignee = application.assignedTo;
  if (assignedTo) application.assignedTo = assignedTo;
  if (managerId) application.managerId = managerId;
  application.version += 1;

  await application.save();

  await Activity.create({
    applicationId: application._id,
    performedBy: req.user._id,
    actionType: prevAssignee ? "REASSIGNED" : "ASSIGNED",
    message: `Application assignment updated.`,
    metadata: { assignedTo, managerId },
  });

  res.status(200).json({ success: true, data: application });
});

// 7. Get Application Audit Trail
exports.getApplicationActivities = asyncHandler(async (req, res, next) => {
  const activities = await Activity.find({ applicationId: req.params.id })
    .populate("performedBy", "name email role")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    results: activities.length,
    data: activities,
  });
});

// 8. Get Application Work Items
exports.getApplicationWorkItems = asyncHandler(async (req, res, next) => {
  const workItems = await WorkItem.find({ applicationId: req.params.id })
    .populate("assignedTo", "name email")
    .populate("attachmentId", "name fileUrl fileType status")
    .sort({ stageOrderNumber: 1, createdAt: 1 });

  res.status(200).json({
    success: true,
    results: workItems.length,
    data: workItems,
  });
});
