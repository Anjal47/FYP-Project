// src/models/Report.js
const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema(
  {
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    reportCode: { type: String, required: true, unique: true, index: true },

    department: {
      type: String,
      enum: ["police", "municipality"],
      default: "police",
      index: true,
    },

    type: { type: String, required: true, trim: true },
    area: { type: String, required: true, trim: true },
    geoLocation: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      accuracy: { type: Number, default: null },
      capturedAt: { type: Date, default: null },
    },
    description: { type: String, default: "", trim: true },
    photoUrl: { type: String, default: "" },
    videoUrl: { type: String, default: "" },
    audioUrl: { type: String, default: "" },

    status: { type: String, enum: ["Open", "Assigned", "Resolved"], default: "Open", index: true },
    priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium", index: true },

    // ✅ ADD THESE (so populate works)
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },

    // ✅ optional but your muni controller edits it
    adminNotes: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", ReportSchema);
