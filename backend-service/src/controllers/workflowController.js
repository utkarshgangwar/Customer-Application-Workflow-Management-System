const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { Workflow } = require("../models");

// Helper to safely extract String ID from populated or unpopulated ObjectId
const getEntityIdString = (entity) => {
  if (!entity) return null;
  if (typeof entity === "string") return entity;
  if (entity._id) return entity._id.toString();
  return entity.toString();
};

// 1. Create Workflow (Admin Only)
exports.createWorkflow = asyncHandler(async (req, res, next) => {
  const { name, stages, teamId, isUniversal, description, code } = req.body;

  if (!name || !name.trim()) {
    return next(new AppError("Workflow name is required.", 400));
  }

  if (!stages || !Array.isArray(stages) || stages.length === 0) {
    return next(
      new AppError("A workflow must have at least one valid stage.", 400),
    );
  }

  const trimmedName = name.trim();

  // Check unique name constraint
  const existing = await Workflow.findOne({ name: trimmedName });
  if (existing) {
    return next(new AppError("A workflow with this name already exists.", 409));
  }

  // Ensure stages have valid orderNumbers and trimmed names
  const normalizedStages = stages.map((stage, idx) => ({
    name: stage.name.trim(),
    orderNumber: stage.orderNumber ?? idx + 1,
    workRequired: stage.workRequired || [],
    allowedTransitions: stage.allowedTransitions || [],
    createdBy: req.user._id,
  }));

  const workflow = await Workflow.create({
    name: trimmedName,
    code: code ? code.trim() : undefined,
    description: description ? description.trim() : undefined,
    stages: normalizedStages,
    teamId: teamId || null,
    isUniversal: isUniversal ?? !teamId,
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, data: workflow });
});

// 2. Get All Workflows (Search + Domain/Role Scoped)
exports.getAllWorkflows = asyncHandler(async (req, res, next) => {
  const { search } = req.query;
  const andConditions = [{ active: { $ne: false } }];

  // 1. Text Search filtering (by workflow name, code, or description)
  if (search && search.trim()) {
    const searchRegex = { $regex: search.trim(), $options: "i" };
    andConditions.push({
      $or: [
        { name: searchRegex },
        { code: searchRegex },
        { description: searchRegex },
      ],
    });
  }

  // 2. Domain / Role Scoping:
  // - Admin: gets all workflows
  // - Manager / Executive: scoped to their team's workflows, unassigned, or universal
  if (req.user.role !== "admin") {
    const userTeamId = getEntityIdString(req.user.teamId);

    if (userTeamId) {
      andConditions.push({
        $or: [{ teamId: userTeamId }, { teamId: null }, { isUniversal: true }],
      });
    } else {
      // Unassigned staff members only see universal / general workflows
      andConditions.push({
        $or: [{ teamId: null }, { isUniversal: true }],
      });
    }
  }

  const filter =
    andConditions.length > 1 ? { $and: andConditions } : andConditions[0];

  const workflows = await Workflow.find(filter)
    .populate("teamId", "name")
    .populate("createdBy", "name email")
    .sort({ name: 1 });

  res.status(200).json({
    success: true,
    results: workflows.length,
    data: workflows,
  });
});

// 3. Get Single Workflow by ID (with authorization guard)
exports.getWorkflowById = asyncHandler(async (req, res, next) => {
  const workflow = await Workflow.findById(req.params.id)
    .populate("teamId", "name")
    .populate("createdBy", "name email");

  if (!workflow) return next(new AppError("Workflow not found.", 404));

  // Security Check: Non-admins cannot inspect workflows outside their team domain unless universal
  if (req.user.role !== "admin" && workflow.teamId && !workflow.isUniversal) {
    const userTeamId = getEntityIdString(req.user.teamId);
    const workflowTeamId = getEntityIdString(workflow.teamId);

    if (!userTeamId || userTeamId !== workflowTeamId) {
      return next(
        new AppError("You do not have permission to view this workflow.", 403),
      );
    }
  }

  res.status(200).json({ success: true, data: workflow });
});

// 4. Update Workflow (Admin Only)
exports.updateWorkflow = asyncHandler(async (req, res, next) => {
  // Check duplicate name if renaming
  if (req.body.name) {
    const existing = await Workflow.findOne({
      name: req.body.name.trim(),
      _id: { $ne: req.params.id },
    });
    if (existing) {
      return next(
        new AppError("Another workflow with this name already exists.", 409),
      );
    }
    req.body.name = req.body.name.trim();
  }

  const workflow = await Workflow.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })
    .populate("teamId", "name")
    .populate("createdBy", "name email");

  if (!workflow) return next(new AppError("Workflow not found.", 404));

  res.status(200).json({ success: true, data: workflow });
});
