const mongoose = require("mongoose");

const StageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  orderNumber: { type: Number, required: true },
  workRequired: [
    {
      workType: { type: String, required: true },
      title: { type: String, required: true },
    },
  ],
  allowedTransitions: [{ type: String }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});

const WorkflowSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    code: { type: String, trim: true },
    description: { type: String },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null, // null means accessible across all teams / universal
    },
    isUniversal: {
      type: Boolean,
      default: false,
    },
    active: {
      type: Boolean,
      default: true,
    },
    stages: [StageSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Workflow", WorkflowSchema);
