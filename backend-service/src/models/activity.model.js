const mongoose = require("mongoose");

const ActivitySchema = new mongoose.Schema(
  {
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CustomerApplication",
      required: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    actionType: {
      type: String,
      enum: [
        "APPLICATION_CREATED",
        "STAGE_UPDATED",
        "STATUS_UPDATED",
        "ASSIGNED",
        "REASSIGNED",
        "WORK_ITEM_CREATED",
        "WORK_ITEM_COMPLETED",
        "EXTERNAL_SYNC_TRIGGERED",
        "DOCUMENT_ATTACHED",
      ],
      required: true,
    },
    message: { type: String, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

ActivitySchema.index({ applicationId: 1, createdAt: -1 });

module.exports = mongoose.model("Activity", ActivitySchema);
