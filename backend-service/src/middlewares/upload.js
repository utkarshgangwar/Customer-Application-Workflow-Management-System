const multer = require("multer");
const path = require("path");
const fs = require("fs");
const AppError = require("../utils/AppError");

const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = /pdf|jpg|jpeg|png|doc|docx/;
  const extname = allowedExtensions.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const mimetype =
    /pdf|image\/(jpeg|png|jpg)|msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document/.test(
      file.mimetype,
    );

  if (extname && mimetype) {
    return cb(null, true);
  }

  // Pass a 400 AppError instead of a generic Error
  cb(
    new AppError(
      "Invalid file format. Only PDF, JPG, JPEG, PNG, and DOC/DOCX files are supported.",
      400,
    ),
    false,
  );
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: fileFilter,
});

module.exports = upload;
