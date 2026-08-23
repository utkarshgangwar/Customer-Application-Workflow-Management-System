const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");
const User = require("../models/user.model");

const protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401),
    );
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const currentUser = await User.findById(decoded.id).populate("teamId");

    if (!currentUser || !currentUser.active) {
      return next(
        new AppError(
          "The user belonging to this token no longer exists or is inactive.",
          401,
        ),
      );
    }

    req.user = currentUser;
    next();
  } catch (err) {
    return next(new AppError("Invalid or expired token.", 401));
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403),
      );
    }
    next();
  };
};

module.exports = { protect, restrictTo };
