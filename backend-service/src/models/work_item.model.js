const mongoose = require("mongoose");

const WorkItemSchema = new mongoose.Schema(
  {
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CustomerApplication",
      required: true,
    },
    stageName: { type: String, required: true },
    stageOrderNumber: { type: Number, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "BLOCKED"],
      default: "PENDING",
    },
    dueDate: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    attachmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("WorkItem", WorkItemSchema);
