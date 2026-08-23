const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["admin", "manager", "executive"],
      default: "executive",
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },
    active: { type: Boolean, default: true },
    profilePicture: { type: String, default: "" },
  },
  { timestamps: true },
);

UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// ==========================================
// Database Operations & Aggregations
// ==========================================

// 1. Fetch Paginated Users with Aggregated Workload Metrics in Parallel
UserSchema.statics.findWithWorkloadStats = async function (
  filter,
  skip,
  limit,
) {
  const WorkItem = mongoose.model("WorkItem");
  const CustomerApplication = mongoose.model("CustomerApplication");
  const Team = mongoose.model("Team");

  const [users, total, teams, workItemStats, docketStats] = await Promise.all([
    this.find(filter)
      .populate("teamId", "name")
      .select("-password")
      .sort({ role: 1, name: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    this.countDocuments(filter),
    Team.find().sort({ name: 1 }).lean(),
    WorkItem.aggregate([
      {
        $group: {
          _id: "$assignedTo",
          totalItems: { $sum: 1 },
          pendingItems: {
            $sum: { $cond: [{ $ne: ["$status", "COMPLETED"] }, 1, 0] },
          },
          completedItems: {
            $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] },
          },
        },
      },
    ]),
    CustomerApplication.aggregate([
      { $match: { status: "ACTIVE" } },
      { $group: { _id: "$assignedTo", activeDockets: { $sum: 1 } } },
    ]),
  ]);

  const workItemMap = new Map(
    workItemStats.map((item) => [item._id?.toString(), item]),
  );
  const docketMap = new Map(
    docketStats.map((doc) => [doc._id?.toString(), doc.activeDockets]),
  );

  const usersWithStats = users.map((u) => {
    const uId = u._id.toString();
    const wStats = workItemMap.get(uId);
    return {
      ...u,
      stats: {
        totalItems: wStats?.totalItems || 0,
        pendingItems: wStats?.pendingItems || 0,
        completedItems: wStats?.completedItems || 0,
        activeDockets: docketMap.get(uId) || 0,
      },
    };
  });

  return { users: usersWithStats, total, teams };
};

// 2. Fetch Single User with Population
UserSchema.statics.findByIdWithTeam = function (userId) {
  return this.findById(userId)
    .populate("teamId", "name")
    .select("-password")
    .lean();
};

// 3. Update User Record and Return Clean Object
UserSchema.statics.updateUserProfile = function (userId, updateFields) {
  return this.findByIdAndUpdate(userId, updateFields, {
    new: true,
    runValidators: true,
  })
    .populate("teamId", "name")
    .select("-password");
};

module.exports = mongoose.model("User", UserSchema);
