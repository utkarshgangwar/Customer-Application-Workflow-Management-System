const mongoose = require("mongoose");

const CustomerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    mobile: {
      code: { type: String, default: "+1" },
      num: { type: String, required: true },
    },
    age: { type: Number },
    gender: { type: String, enum: ["male", "female", "other"] },
    dob: { type: Date },
    country: { type: String, default: "" },
    city: { type: String, default: "" },
    address: { type: String, default: "" },
    pincode: { type: String, default: "" },
    profileImage: { type: String, default: "" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

CustomerSchema.index({ name: "text", email: "text", "mobile.num": "text" });

module.exports = mongoose.model("Customer", CustomerSchema);
