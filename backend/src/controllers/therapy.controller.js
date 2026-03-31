const User = require("../models/User");
const TherapyRequest = require("../models/TherapyRequest");
const TherapyAppointment = require("../models/TherapyAppointment");

/** POST /api/therapy/requests */
exports.createTherapyRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { problem, age, gender, language, mode, description = "" } = req.body;

    if (!problem || !age || !gender || !language || !mode) {
      return res.status(400).json({ ok: false, message: "problem, age, gender, language, mode required" });
    }

    const reqDoc = await TherapyRequest.create({
      userId,
      problem,
      age: Number(age),
      gender,
      language,
      mode,
      description,
      status: "pending",
    });

    return res.status(201).json({ ok: true, request: { id: reqDoc._id, status: reqDoc.status } });
  } catch (e) {
    return res.status(500).json({ ok: false, message: "Failed to submit therapy form", error: e?.message });
  }
};

/** GET /api/therapy/therapists */
exports.listTherapists = async (req, res) => {
  try {
    const therapists = await User.find({ role: "therapist", isActive: true })
      .select("_id fullName email phone bio qualification workingArea")
      .sort({ createdAt: -1 });

    return res.json({
      ok: true,
      therapists: therapists.map((t) => ({
        id: t._id,
        fullName: t.fullName,
        email: t.email,
        phone: t.phone || "",
        bio: t.bio || "",
        qualification: t.qualification || "",
        workingArea: t.workingArea || "",
      })),
    });
  } catch (e) {
    return res.status(500).json({ ok: false, message: "Failed to load therapists" });
  }
};

/** POST /api/therapy/appointments */
/** POST /api/therapy/appointments */
exports.bookAppointment = async (req, res) => {
  try {
    const userId = req.user.id;
    let { therapistId, requestId, month = "December", day, slot, notes = "" } = req.body;

    // ✅ normalize (prevents "09:00 " vs "09:00")
    month = String(month || "").trim();
    slot = String(slot || "").trim();
    day = Number(day);

    if (!therapistId || !requestId || !month || !day || !slot) {
      return res.status(400).json({
        ok: false,
        message: "therapistId, requestId, month, day, slot required",
      });
    }

    const therapist = await User.findOne({ _id: therapistId, role: "therapist", isActive: true });
    if (!therapist) return res.status(404).json({ ok: false, message: "Therapist not found" });

    const reqDoc = await TherapyRequest.findOne({ _id: requestId, userId });
    if (!reqDoc) return res.status(404).json({ ok: false, message: "Therapy request not found" });

    // ✅ RULE 1: therapist slot must be free (only pending/confirmed blocks)
    const therapistBusy = await TherapyAppointment.findOne({
      therapistId,
      month,
      day,
      slot,
      status: { $in: ["pending", "confirmed"] },
    }).select("_id");

    if (therapistBusy) {
      return res.status(409).json({ ok: false, message: "That slot is already booked for this therapist." });
    }

    // ✅ RULE 2: user cannot double-book same time
    const userBusy = await TherapyAppointment.findOne({
      userId,
      month,
      day,
      slot,
      status: { $in: ["pending", "confirmed"] },
    }).select("_id");

    if (userBusy) {
      return res.status(409).json({
        ok: false,
        message: "You already have a therapy session booked at this time. Please choose another slot.",
      });
    }

    const appt = await TherapyAppointment.create({
      userId,
      therapistId,
      requestId,
      month,
      day,
      slot,
      notes,
      status: "pending",
    });

    reqDoc.status = "booked";
    await reqDoc.save();

    return res.status(201).json({
      ok: true,
      appointment: {
        id: appt._id,
        therapistId,
        requestId,
        month,
        day,
        slot,
        status: appt.status,
      },
    });
  } catch (e) {
    // ✅ DB unique index protection (race condition safety)
    if (e?.code === 11000) {
      const key = e?.keyPattern || {};
      if (key.userId) {
        return res.status(409).json({
          ok: false,
          message: "You already have a therapy session booked at this time. Please choose another slot.",
        });
      }
      return res.status(409).json({ ok: false, message: "That slot is already booked for this therapist." });
    }

    return res.status(500).json({ ok: false, message: "Failed to book appointment", error: e?.message });
  }
};

exports.getTherapistAppointments = async (req, res) => {
  try {
    if (req.user?.role !== "therapist") {
      return res.status(403).json({ ok: false, message: "Therapist access only" });
    }

    const therapistId = req.user.id;

    const appts = await TherapyAppointment.find({ therapistId })
      .populate("userId", "fullName email phone")
      .populate("requestId", "problem mode language description status")
      .sort({ createdAt: -1 });

    return res.json({
      ok: true,
      appointments: appts.map((a) => ({
        id: a._id,
        status: a.status,
        month: a.month,
        day: a.day,
        slot: a.slot,
        notes: a.notes || "",
        createdAt: a.createdAt,

        // ✅ IMPORTANT: send user (not client)
        user: {
          id: a.userId?._id,
          fullName: a.userId?.fullName || "Unknown",
          email: a.userId?.email || "",
          phone: a.userId?.phone || "",
        },

        request: {
          id: a.requestId?._id,
          problem: a.requestId?.problem || "",
          mode: a.requestId?.mode || "",
          language: a.requestId?.language || "",
          description: a.requestId?.description || "",
          status: a.requestId?.status || "",
        },
      })),
    });
  } catch (e) {
    return res.status(500).json({ ok: false, message: "Failed to load appointments", error: e?.message });
  }
};

/**
 * PATCH /api/therapy/therapist/appointments/:id/status
 * Therapist can confirm/cancel/complete appointment
 */
exports.updateTherapistAppointmentStatus = async (req, res) => {
  try {
    if (req.user?.role !== "therapist") {
      return res.status(403).json({ ok: false, message: "Therapist access only" });
    }

    const therapistId = req.user.id;
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ["pending", "confirmed", "cancelled", "completed"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ ok: false, message: "Invalid status" });
    }

    const appt = await TherapyAppointment.findOne({ _id: id, therapistId });
    if (!appt) return res.status(404).json({ ok: false, message: "Appointment not found" });

    appt.status = status;
    await appt.save();

    return res.json({ ok: true, appointment: { id: appt._id, status: appt.status } });
  } catch (e) {
    return res.status(500).json({ ok: false, message: "Failed to update status", error: e?.message });
  }
};
exports.getMyTherapyAppointments = async (req, res) => {
  try {
    const userId = req.user.id;

    const appts = await TherapyAppointment.find({ userId })
      .populate("therapistId", "fullName email phone qualification workingArea")
      .sort({ createdAt: -1 });

    return res.json({
      ok: true,
      appointments: appts.map((a) => ({
        id: a._id,
        status: a.status,
        month: a.month,
        day: a.day,
        slot: a.slot,
        createdAt: a.createdAt,
        therapist: {
          id: a.therapistId?._id,
          fullName: a.therapistId?.fullName || "Unknown",
          email: a.therapistId?.email || "",
          phone: a.therapistId?.phone || "",
          qualification: a.therapistId?.qualification || "",
          workingArea: a.therapistId?.workingArea || "",
        },
      })),
    });
  } catch (e) {
    return res.status(500).json({ ok: false, message: "Failed to load your appointments" });
  }
};
exports.therapistConfirmAppointment = async (req, res) => {
  try {
    const therapistId = req.user.id;

    const appt = await TherapyAppointment.findOne({
      _id: req.params.id,
      therapistId,
    });

    if (!appt) return res.status(404).json({ ok: false, message: "Appointment not found" });

    // only pending -> confirmed
    if (appt.status !== "pending") {
      return res.status(400).json({ ok: false, message: `Cannot confirm. Current status: ${appt.status}` });
    }

    appt.status = "confirmed";
    await appt.save();

    return res.json({ ok: true, appointment: { id: appt._id, status: appt.status } });
  } catch (e) {
    return res.status(500).json({ ok: false, message: "Failed to confirm appointment" });
  }
};

/**
 * PATCH /api/therapy/appointments/:id/decline
 * Therapist declines an appointment
 */
exports.therapistDeclineAppointment = async (req, res) => {
  try {
    const therapistId = req.user.id;

    const appt = await TherapyAppointment.findOne({
      _id: req.params.id,
      therapistId,
    });

    if (!appt) return res.status(404).json({ ok: false, message: "Appointment not found" });

    // pending/confirmed -> cancelled (your choice; you can restrict to only pending)
    if (appt.status === "cancelled" || appt.status === "completed") {
      return res.status(400).json({ ok: false, message: `Cannot decline. Current status: ${appt.status}` });
    }

    appt.status = "cancelled";
    await appt.save();

    return res.json({ ok: true, appointment: { id: appt._id, status: appt.status } });
  } catch (e) {
    return res.status(500).json({ ok: false, message: "Failed to decline appointment" });
  }
};