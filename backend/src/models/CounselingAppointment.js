const mongoose = require("mongoose");

const CounselingAppointmentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    counsellorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    requestId: { type: mongoose.Schema.Types.ObjectId, ref: "CounselingRequest", required: true },

    month: { type: String, default: "December" },
    day: { type: Number, required: true },
    slot: { type: String, required: true },

    notes: { type: String, default: "" },

    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// prevent double booking same counsellor + same slot
CounselingAppointmentSchema.index(
  { counsellorId: 1, month: 1, day: 1, slot: 1 },
  { unique: true }
);

module.exports = mongoose.model("CounselingAppointment", CounselingAppointmentSchema);
