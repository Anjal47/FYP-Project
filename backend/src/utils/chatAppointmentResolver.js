// utils/resolveChatFromAppointment.js (or wherever you keep it)
const mongoose = require("mongoose");

const CounselingAppointment = require("../models/CounselingAppointment");
const TherapyAppointment = require("../models/TherapyAppointment"); // ✅ ADD THIS

const norm = (v) => String(v || "").toLowerCase().trim();
const isConfirmed = (s) => ["confirmed"].includes(norm(s));

/**
 * ✅ Resolve chat participants from appointmentId
 * - Works for BOTH CounselingAppointment and TherapyAppointment
 * - Must be confirmed (approved)
 * - ❌ NO MORE online-only restriction (as you requested)
 */
async function resolveChatFromAppointment(appointmentId) {
  if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
    throw new Error("Invalid appointmentId");
  }

  // ---------------------------
  // 1) Try Counseling first
  // ---------------------------
  const counseling = await CounselingAppointment.findById(appointmentId)
    .populate("userId")
    .populate("counsellorId")
    .populate("requestId");

  if (counseling) {
    if (!isConfirmed(counseling.status)) {
      throw new Error("Chat only allowed after your appointment is Approved");
    }

    const userId = counseling.userId?._id || counseling.userId;
    const staffId = counseling.counsellorId?._id || counseling.counsellorId;

    if (!userId) throw new Error("Missing userId in appointment");
    if (!staffId) throw new Error("Missing counsellorId in appointment");

    return {
      appointmentId: counseling._id,
      serviceType: "counseling",
      userId,
      staffId,
      staffRole: "counsellor",
      status: counseling.status,
    };
  }

  // ---------------------------
  // 2) Try Therapy
  // ---------------------------
  const therapy = await TherapyAppointment.findById(appointmentId)
    .populate("userId")
    .populate("therapistId")
    .populate("requestId");

  if (therapy) {
    if (!isConfirmed(therapy.status)) {
      throw new Error("Chat only allowed after your appointment is Approved");
    }

    const userId = therapy.userId?._id || therapy.userId;
    const staffId = therapy.therapistId?._id || therapy.therapistId;

    if (!userId) throw new Error("Missing userId in appointment");
    if (!staffId) throw new Error("Missing therapistId in appointment");

    return {
      appointmentId: therapy._id,
      serviceType: "therapy",
      userId,
      staffId,
      staffRole: "therapist",
      status: therapy.status,
    };
  }

  // ---------------------------
  // Not found anywhere
  // ---------------------------
  throw new Error("Appointment not found");
}

module.exports = { resolveChatFromAppointment };
