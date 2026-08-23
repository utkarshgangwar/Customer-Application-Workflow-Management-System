const path = require("path");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { Document, WorkItem, Activity } = require("../models");

// Upload document & link to work item
exports.uploadDocument = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError("No file uploaded.", 400));
  }

  const { customerId, workItemId, name, type } = req.body;
  const fileUrl = `/uploads/${req.file.filename}`;
  const fileExtension =
    path.extname(req.file.originalname).replace(".", "").toUpperCase() ||
    "FILE";

  const doc = await Document.create({
    customerId: customerId || null,
    name: name || req.file.originalname,
    type: type || fileExtension || "ATTACHMENT", // <--- Missing required field added
    fileUrl: fileUrl,
    fileType: req.file.mimetype,
    status: "pending",
    uploadedBy: req.user?._id || null,
  });

  // Link to WorkItem if ID provided
  if (workItemId) {
    const workItem = await WorkItem.findById(workItemId);
    if (workItem) {
      workItem.attachmentId = doc._id;
      await workItem.save();

      await Activity.create({
        applicationId: workItem.applicationId,
        performedBy: req.user?._id || null,
        actionType: "DOCUMENT_ATTACHED",
        message: `Attached "${doc.name}" to task "${workItem.title}".`,
        metadata: { workItemId, documentId: doc._id },
      });
    }
  }

  res.status(201).json({
    success: true,
    data: doc,
  });
});
