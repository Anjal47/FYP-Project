const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const UserSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },

    role: {
      type: String,
      enum: ["user", "admin", "counsellor", "police", "therapist"],
      default: "user",
    },

    // ✅ Staff profile fields
    bio: { type: String, default: "" },
    qualification: { type: String, default: "" },
    workingArea: { type: String, default: "" },
    phone: { type: String, default: "" },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

UserSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

module.exports = mongoose.model("User", UserSchema);
