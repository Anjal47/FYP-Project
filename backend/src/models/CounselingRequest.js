const mongoose = require("mongoose");

const CounselingRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    problem: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 1, max: 120 },
    gender: { type: String, enum: ["Male", "Female"], required: true },
    language: { type: String, enum: ["Nepali", "English"], required: true },
    mode: { type: String, enum: ["Online", "Offline"], required: true },
    description: { type: String, default: "", trim: true },

    status: {
      type: String,
      enum: ["Open", "Matched", "Closed"],
      default: "Open",
    },

    // optional: after user picks counselor
    counsellor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CounselingRequest", CounselingRequestSchema);
