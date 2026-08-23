const mongoose = require("mongoose");

const CustomerApplicationSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    workflowId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workflow",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    priority: {
      type: Number,
      enum: [0, 1, 2, 3], // 0: Low, 1: Medium, 2: High, 3: Urgent
      default: 1,
    },
    // Pipeline Progress (Workflow Stages: e.g., NEW_REGISTRATION -> DOCUMENTATION -> COMPLETED)
    currentStage: {
      type: String,
      required: true,
      default: "NEW_REGISTRATION",
    },
    // Global Operational State (Application Health)
    status: {
      type: String,
      enum: ["ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"],
      default: "ACTIVE",
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    version: {
      type: Number,
      default: 1, // Optimistic Concurrency Control
    },
  },
  { timestamps: true },
);

CustomerApplicationSchema.index({ customerId: 1, currentStage: 1, status: 1 });

module.exports = mongoose.model(
  "CustomerApplication",
  CustomerApplicationSchema,
);
