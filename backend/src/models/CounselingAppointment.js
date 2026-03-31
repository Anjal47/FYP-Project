// models/CounselingAppointment.js
const mongoose = require("mongoose");

const CounselingAppointmentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    counsellorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: "CounselingRequest", required: true },

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
 * ✅ RULE 1:
 * Same counsellor cannot be booked at the same month/day/slot
 * ONLY for active statuses: pending/confirmed
 */
CounselingAppointmentSchema.index(
  { counsellorId: 1, month: 1, day: 1, slot: 1 },
  {
    unique: true,
    name: "uniq_active_counsellor_slot",
    partialFilterExpression: { status: { $in: ["pending", "confirmed"] } },
  }
);

/**
 * ✅ RULE 2:
 * Same user cannot book multiple sessions at same month/day/slot
 * ONLY for active statuses: pending/confirmed
 */
CounselingAppointmentSchema.index(
  { userId: 1, month: 1, day: 1, slot: 1 },
  {
    unique: true,
    name: "uniq_active_user_slot",
    partialFilterExpression: { status: { $in: ["pending", "confirmed"] } },
  }
);

module.exports = mongoose.model("CounselingAppointment", CounselingAppointmentSchema);
