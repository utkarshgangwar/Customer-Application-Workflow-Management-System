const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { User, Team, Workflow } = require("../models");

// 1. Get All Users (Workflow Group Scoping & Workload Distribution)
exports.getAllUsers = asyncHandler(async (req, res, next) => {
  const { search, teamId, workflowId, page = 1, limit = 50 } = req.query;
  const andConditions = [];

  let resolvedTeamId = teamId || null;

  // Business Logic: Resolve workflow domain group if workflowId is provided
  if (workflowId) {
    const wf = await Workflow.findById(workflowId).select("teamId");
    if (wf && wf.teamId) {
      resolvedTeamId = wf.teamId.toString();
    }
  }

  // Business Logic: Role & Unit Scoping
  if (resolvedTeamId) {
    andConditions.push({
      teamId: resolvedTeamId,
      role: { $in: ["executive", "manager"] },
      active: true,
    });
  } else if (workflowId) {
    // Universal Workflow: return all operational staff
    andConditions.push({
      role: { $in: ["executive", "manager"] },
      active: true,
    });
  } else if (req.user.role === "manager" && req.user.teamId) {
    // Manager default scope: their team only
    andConditions.push({ teamId: req.user.teamId });
  }

  // Business Logic: Text Search Sanitization
  if (search && search.trim()) {
    const searchRegex = { $regex: search.trim(), $options: "i" };
    andConditions.push({
      $or: [{ name: searchRegex }, { email: searchRegex }],
    });
  }

  const filter =
    andConditions.length > 0
      ? andConditions.length === 1
        ? andConditions[0]
        : { $and: andConditions }
      : {};

  const parsedPage = parseInt(page, 10) || 1;
  const parsedLimit = parseInt(limit, 10) || 50;
  const skip = (parsedPage - 1) * parsedLimit;

  // Delegate Database Aggregation & Fetching to Model
  const { users, total, teams } = await User.findWithWorkloadStats(
    filter,
    skip,
    parsedLimit,
  );

  res.status(200).json({
    success: true,
    results: users.length,
    pagination: {
      total,
      page: parsedPage,
      limit: parsedLimit,
      pages: Math.ceil(total / parsedLimit) || 1,
    },
    data: { users, teams },
  });
});

// 2. Get User by ID
exports.getUserById = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdWithTeam(req.params.id);
  if (!user) return next(new AppError("User not found.", 404));

  res.status(200).json({ success: true, data: user });
});

// 3. Create Staff User (Admin Only)
exports.createUser = asyncHandler(async (req, res, next) => {
  const { name, email, password, role, teamId } = req.body;

  // Business Logic: Validation
  if (!name || !email || !password) {
    return next(new AppError("Name, email, and password are required.", 400));
  }

  const normalizedEmail = email.toLowerCase().trim();
  const exists = await User.findOne({ email: normalizedEmail });
  if (exists) {
    return next(
      new AppError("A user with this email is already registered.", 409),
    );
  }

  if (teamId) {
    const teamExists = await Team.findById(teamId);
    if (!teamExists) {
      return next(new AppError("Selected team unit does not exist.", 404));
    }
  }

  // Model execution
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
    role: role || "executive",
    teamId: teamId || null,
  });

  user.password = undefined;
  res.status(201).json({ success: true, data: user });
});

// 4. Update Staff Profile / Permissions
exports.updateUser = asyncHandler(async (req, res, next) => {
  const targetUserId = req.params.id;
  const isSelf = req.user._id.toString() === targetUserId;
  const isAdmin = req.user.role === "admin";

  // Business Logic: Authorization gate
  if (!isSelf && !isAdmin) {
    return next(
      new AppError("You do not have permission to edit this profile.", 403),
    );
  }

  const updates = {};
  if (req.body.name) updates.name = req.body.name.trim();

  // Business Logic: Email uniqueness verification
  if (req.body.email) {
    const normalizedEmail = req.body.email.toLowerCase().trim();
    const emailConflict = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: targetUserId },
    });
    if (emailConflict) {
      return next(new AppError("This email address is already in use.", 409));
    }
    updates.email = normalizedEmail;
  }

  // Business Logic: Admin-only privilege delegation
  if (isAdmin) {
    if (req.body.role) updates.role = req.body.role;
    if (req.body.teamId !== undefined) {
      updates.teamId = req.body.teamId || null;
    }
    if (req.body.active !== undefined) updates.active = req.body.active;
  }

  // Delegate update & population to Model
  const updatedUser = await User.updateUserProfile(targetUserId, updates);
  if (!updatedUser) return next(new AppError("User not found.", 404));

  res.status(200).json({ success: true, data: updatedUser });
});
