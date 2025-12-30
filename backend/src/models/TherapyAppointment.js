const mongoose = require("mongoose");

const TherapyAppointmentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    therapistId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    requestId: { type: mongoose.Schema.Types.ObjectId, ref: "TherapyRequest", required: true },

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

TherapyAppointmentSchema.index({ therapistId: 1, month: 1, day: 1, slot: 1 }, { unique: true });

module.exports = mongoose.model("TherapyAppointment", TherapyAppointmentSchema);
