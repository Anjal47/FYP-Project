// models/TherapyAppointment.js
const mongoose = require("mongoose");

const TherapyAppointmentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    therapistId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: "TherapyRequest", required: true },

    month: { type: String, required: true, trim: true },
    day: { type: Number, required: true, min: 1, max: 31 },
    slot: { type: String, required: true, trim: true },
    notes: { type: String, default: "" },

    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

/**
 * ✅ RULE 1: Therapist cannot be booked twice at same month/day/slot
 * Only active bookings (pending/confirmed) block the slot.
 */
TherapyAppointmentSchema.index(
  { therapistId: 1, month: 1, day: 1, slot: 1 },
  {
    unique: true,
    name: "uniq_active_therapist_slot",
    partialFilterExpression: { status: { $in: ["pending", "confirmed"] } },
  }
);

/**
 * ✅ RULE 2: Same user cannot book another therapy session at same time (month/day/slot)
 * Only active bookings (pending/confirmed) block.
 */
TherapyAppointmentSchema.index(
  { userId: 1, month: 1, day: 1, slot: 1 },
  {
    unique: true,
    name: "uniq_active_user_therapy_slot",
    partialFilterExpression: { status: { $in: ["pending", "confirmed"] } },
  }
);

module.exports = mongoose.model("TherapyAppointment", TherapyAppointmentSchema);
