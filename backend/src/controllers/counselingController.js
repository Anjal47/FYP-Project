const User = require("../models/User");
const CounselingRequest = require("../models/CounselingRequest");
const CounselingAppointment = require("../models/CounselingAppointment");

// POST /api/counseling/requests
exports.createCounselingRequest = async (req, res) => {
  try {
    const { problem, age, gender, language, mode, description } = req.body;

    if (!problem || !age || !gender || !language || !mode) {
      return res.status(400).json({ message: "problem, age, gender, language, mode are required" });
    }

    const nAge = Number(age);
    if (!Number.isFinite(nAge) || nAge <= 0) {
      return res.status(400).json({ message: "age must be a valid number" });
    }

    const doc = await CounselingRequest.create({
      user: req.user._id,
      problem: String(problem).trim(),
      age: nAge,
      gender,
      language,
      mode,
      description: String(description || "").trim(),
    });

    return res.status(201).json({ ok: true, request: doc });
  } catch (e) {
    return res.status(500).json({ message: "Server error", error: e?.message });
  }
};

// GET /api/counseling/counsellors
exports.listCounsellors = async (req, res) => {
  try {
    const q = String(req.query.q || "").trim().toLowerCase();

    const filter = {
      role: "counsellor",
      isActive: true,
    };

    if (q) {
      filter.$or = [
        { fullName: { $regex: q, $options: "i" } },
        { workingArea: { $regex: q, $options: "i" } },
        { qualification: { $regex: q, $options: "i" } },
      ];
    }

    const counsellors = await User.find(filter)
      .select("fullName email role bio qualification workingArea phone")
      .sort({ createdAt: -1 });

    return res.json({ ok: true, counsellors });
  } catch (e) {
    return res.status(500).json({ message: "Server error", error: e?.message });
  }
};

// POST /api/counseling/requests
exports.createCounselingRequest = async (req, res) => {
  try {
    const { problem, age, gender, language, mode, description } = req.body;

    if (!problem || !age || !gender || !language || !mode) {
      return res.status(400).json({ ok: false, message: "problem, age, gender, language, mode are required" });
    }

    const nAge = Number(age);
    if (!Number.isFinite(nAge) || nAge <= 0) {
      return res.status(400).json({ ok: false, message: "age must be a valid number" });
    }

    const doc = await CounselingRequest.create({
      user: req.user._id,
      problem: String(problem).trim(),
      age: nAge,
      gender,
      language,
      mode,
      description: String(description || "").trim(),
      status: "Open",
    });

    return res.status(201).json({ ok: true, request: { id: doc._id, status: doc.status } });
  } catch (e) {
    return res.status(500).json({ ok: false, message: "Server error", error: e?.message });
  }
};

// GET /api/counseling/counsellors
exports.listCounsellors = async (req, res) => {
  try {
    const q = String(req.query.q || "").trim().toLowerCase();

    const filter = { role: "counsellor", isActive: true };

    if (q) {
      filter.$or = [
        { fullName: { $regex: q, $options: "i" } },
        { workingArea: { $regex: q, $options: "i" } },
        { qualification: { $regex: q, $options: "i" } },
      ];
    }

    const counsellors = await User.find(filter)
      .select("_id fullName email role bio qualification workingArea phone")
      .sort({ createdAt: -1 });

    return res.json({
      ok: true,
      counsellors: counsellors.map((c) => ({
        id: c._id,
        fullName: c.fullName,
        email: c.email,
        phone: c.phone || "",
        bio: c.bio || "",
        qualification: c.qualification || "",
        workingArea: c.workingArea || "",
      })),
    });
  } catch (e) {
    return res.status(500).json({ ok: false, message: "Server error", error: e?.message });
  }
};

// POST /api/counseling/appointments
exports.bookCounselingAppointment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { counsellorId, requestId, month = "December", day, slot, notes = "" } = req.body;

    if (!counsellorId || !requestId || !day || !slot) {
      return res.status(400).json({ ok: false, message: "counsellorId, requestId, day, slot required" });
    }

    const counsellor = await User.findOne({ _id: counsellorId, role: "counsellor", isActive: true });
    if (!counsellor) return res.status(404).json({ ok: false, message: "Counsellor not found" });

    const reqDoc = await CounselingRequest.findOne({ _id: requestId, user: userId });
    if (!reqDoc) return res.status(404).json({ ok: false, message: "Counseling request not found" });

    const appt = await CounselingAppointment.create({
      userId,
      counsellorId,
      requestId,
      month,
      day,
      slot,
      notes,
      status: "pending",
    });

    // link counsellor into request + mark matched
    reqDoc.status = "Matched";
    reqDoc.counsellor = counsellorId;
    await reqDoc.save();

    return res.status(201).json({
      ok: true,
      appointment: { id: appt._id, status: appt.status, month, day, slot },
    });
  } catch (e) {
    if (e?.code === 11000) {
      return res.status(409).json({ ok: false, message: "That slot is already booked for this counsellor." });
    }
    return res.status(500).json({ ok: false, message: "Failed to book appointment", error: e?.message });
  }
};

// GET /api/counseling/my/appointments (user)
exports.getMyCounselingAppointments = async (req, res) => {
  try {
    const userId = req.user.id;

    const appts = await CounselingAppointment.find({ userId })
      .populate("counsellorId", "fullName email phone workingArea qualification")
      .sort({ createdAt: -1 });

    return res.json({
      ok: true,
      appointments: appts.map((a) => ({
        id: a._id,
        month: a.month,
        day: a.day,
        slot: a.slot,
        status: a.status,
        counsellor: a.counsellorId
          ? {
              id: a.counsellorId._id,
              fullName: a.counsellorId.fullName,
              email: a.counsellorId.email,
              phone: a.counsellorId.phone || "",
              workingArea: a.counsellorId.workingArea || "",
              qualification: a.counsellorId.qualification || "",
            }
          : null,
      })),
    });
  } catch (e) {
    return res.status(500).json({ ok: false, message: "Failed to load your counselling bookings" });
  }
};

// GET /api/counseling/counsellor/appointments (counsellor dashboard)
exports.getCounsellorAppointments = async (req, res) => {
  try {
    const counsellorId = req.user.id;

    const appts = await CounselingAppointment.find({ counsellorId })
      .populate("userId", "fullName email phone")
      .populate("requestId", "problem age gender language mode description")
      .sort({ createdAt: -1 });

    return res.json({
      ok: true,
      appointments: appts.map((a) => ({
        id: a._id,
        status: a.status,
        month: a.month,
        day: a.day,
        slot: a.slot,
        user: a.userId
          ? {
              id: a.userId._id,
              fullName: a.userId.fullName,
              email: a.userId.email,
              phone: a.userId.phone || "",
            }
          : null,
        request: a.requestId
          ? {
              id: a.requestId._id,
              problem: a.requestId.problem,
              age: a.requestId.age,
              gender: a.requestId.gender,
              language: a.requestId.language,
              mode: a.requestId.mode,
              description: a.requestId.description || "",
            }
          : null,
      })),
    });
  } catch (e) {
    return res.status(500).json({ ok: false, message: "Failed to load counsellor appointments" });
  }
};

// PATCH /api/counseling/appointments/:id/confirm
exports.counsellorConfirmAppointment = async (req, res) => {
  try {
    const counsellorId = req.user.id;

    const appt = await CounselingAppointment.findOne({ _id: req.params.id, counsellorId });
    if (!appt) return res.status(404).json({ ok: false, message: "Appointment not found" });

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

// PATCH /api/counseling/appointments/:id/decline
exports.counsellorDeclineAppointment = async (req, res) => {
  try {
    const counsellorId = req.user.id;

    const appt = await CounselingAppointment.findOne({ _id: req.params.id, counsellorId });
    if (!appt) return res.status(404).json({ ok: false, message: "Appointment not found" });

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