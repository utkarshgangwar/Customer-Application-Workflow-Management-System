const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { User, RefreshToken } = require("../models");

const generateTokens = async (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  });

  const refreshToken = crypto.randomBytes(40).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await RefreshToken.create({
    userId,
    token: refreshToken,
    expiresAt,
  });

  return { accessToken, refreshToken };
};

exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role, teamId } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError("Email is already registered.", 409));
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role || "executive",
    teamId: teamId || null,
  });

  const { accessToken, refreshToken } = await generateTokens(user._id);

  user.password = undefined;

  res.status(201).json({
    success: true,
    data: { user, accessToken, refreshToken },
  });
});

exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Please provide email and password.", 400));
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError("Invalid credentials.", 401));
  }

  if (!user.active) {
    return next(new AppError("Your account has been deactivated.", 403));
  }

  const { accessToken, refreshToken } = await generateTokens(user._id);

  user.password = undefined;

  res.status(200).json({
    success: true,
    data: { user, accessToken, refreshToken },
  });
});

exports.refreshToken = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return next(new AppError("Refresh token is required", 400));
  }

  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  const user = await User.findById(decoded.id);

  if (!user || !user.active) {
    return next(new AppError("User not found or inactive", 401));
  }

  // Issue new tokens
  const accessToken = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    },
  );
  const newRefreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    },
  );

  res.status(200).json({
    success: true,
    data: {
      accessToken,
      refreshToken: newRefreshToken,
    },
  });
});

exports.logout = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await RefreshToken.deleteOne({ token: refreshToken });
  }
  res.status(200).json({ success: true, message: "Logged out successfully" });
});
