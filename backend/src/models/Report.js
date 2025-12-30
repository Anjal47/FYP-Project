const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema(
  {
    // Who created it (normal user)
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Core report info
    type: { type: String, required: true, trim: true },        // e.g. Harassment / Violence / Traffic
    area: { type: String, required: true, trim: true },        // location/area
    description: { type: String, default: "", trim: true },

    // Admin workflow
    status: {
      type: String,
      enum: ["Open", "Assigned", "Resolved"],
      default: "Open",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },

    // Assign to police (optional)
    assignedPolice: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // Optional admin notes
    adminNotes: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", ReportSchema);
