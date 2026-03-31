const mongoose = require("mongoose");

const MunicipalityReportSchema = new mongoose.Schema(
  {
    report: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Report",
      required: true,
      unique: true,
    },

    issueType: {
      type: String,
      required: true,
    },

    departmentAssigned: {
      type: String,
      default: "",
    },

    estimatedResolutionDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MunicipalityReport", MunicipalityReportSchema);
