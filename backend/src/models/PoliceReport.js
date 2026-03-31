const mongoose = require("mongoose");

const PoliceReportSchema = new mongoose.Schema(
  {
    report: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Report",
      required: true,
      unique: true,
    },

    crimeType: {
      type: String,
      required: true,
    },

    suspectDescription: {
      type: String,
      default: "",
    },

    officerAssigned: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PoliceReport", PoliceReportSchema);
