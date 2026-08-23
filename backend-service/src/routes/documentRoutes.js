const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload");
const { uploadDocument } = require("../controllers/documentController");
const { protect } = require("../middlewares/auth");
const AppError = require("../utils/AppError");

router.use(protect);

// Middleware wrapper to intercept Multer limits and format errors
const handleUpload = (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return next(new AppError("File size exceeds the 10MB limit.", 400));
      }
      return next(err);
    }
    next();
  });
};

router.post("/upload", handleUpload, uploadDocument);

module.exports = router;
