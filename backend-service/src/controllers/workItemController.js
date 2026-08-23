const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { WorkItem, CustomerApplication, Activity } = require("../models");

exports.createWorkItem = asyncHandler(async (req, res, next) => {
  const {
    applicationId,
    stageName,
    stageOrderNumber,
    title,
    description,
    assignedTo,
    dueDate,
  } = req.body;

  const application = await CustomerApplication.findById(applicationId);
  if (!application)
    return next(new AppError("Target application does not exist.", 404));

  const workItem = await WorkItem.create({
    applicationId,
    stageName,
    stageOrderNumber,
    title,
    description,
    assignedTo: assignedTo || req.user._id,
    dueDate,
  });

  await Activity.create({
    applicationId,
    performedBy: req.user._id,
    actionType: "WORK_ITEM_CREATED",
    message: `Created work item: ${title}`,
    metadata: { workItemId: workItem._id },
  });

  res.status(201).json({ success: true, data: workItem });
});

exports.getWorkItemById = asyncHandler(async (req, res, next) => {
  const workItem = await WorkItem.findById(req.params.id)
    .populate("assignedTo", "name email")
    .populate("attachmentId", "name fileUrl fileType status");

  if (!workItem) return next(new AppError("Work item not found.", 404));
  res.status(200).json({ success: true, data: workItem });
});

exports.updateWorkItem = asyncHandler(async (req, res, next) => {
  const { status, title, description, assignedTo, dueDate, attachmentId } =
    req.body;

  const workItem = await WorkItem.findById(req.params.id);
  if (!workItem) return next(new AppError("Work item not found.", 404));

  if (title) workItem.title = title;
  if (description !== undefined) workItem.description = description;
  if (assignedTo) workItem.assignedTo = assignedTo;
  if (dueDate) workItem.dueDate = dueDate;

  // ✅ 1. Save attachmentId when provided
  if (attachmentId !== undefined) {
    workItem.attachmentId = attachmentId;
  }

  if (status && status !== workItem.status) {
    workItem.status = status;
    if (status === "COMPLETED") {
      workItem.completedAt = new Date();
      await Activity.create({
        applicationId: workItem.applicationId,
        performedBy: req.user._id,
        actionType: "WORK_ITEM_COMPLETED",
        message: `Work item "${workItem.title}" marked as COMPLETED.`,
        metadata: { workItemId: workItem._id },
      });
    } else if (status === "PENDING") {
      workItem.completedAt = null;
    }
  }

  await workItem.save();

  // ✅ 2. Populate attachmentId and assignedTo before sending response
  await workItem.populate([
    { path: "assignedTo", select: "name email" },
    { path: "attachmentId", select: "name fileUrl fileType status" },
  ]);

  res.status(200).json({ success: true, data: workItem });
});
