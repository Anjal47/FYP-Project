const mongoose = require("mongoose");

const TherapyRequestSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    problem: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, enum: ["Male", "Female"], required: true },
    language: { type: String, enum: ["Nepali", "English"], required: true },
    mode: { type: String, enum: ["Online", "Offline"], required: true },
    description: { type: String, default: "" },

    status: {
      type: String,
      enum: ["pending", "booked", "cancelled", "resolved"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TherapyRequest", TherapyRequestSchema);
