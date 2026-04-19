// controllers/counselingController.js
const mongoose = require("mongoose");
const User = require("../models/User");
const CounselingRequest = require("../models/CounselingRequest");
const CounselingAppointment = require("../models/CounselingAppointment");
const CounselingReview = require("../models/CounselingReview");

/**
 * Safe user id getter (supports req.user.id or req.user._id)
 */
const getAuthId = (req) => String(req?.user?._id || req?.user?.id || "");
const toObjectIdList = (values = []) =>
  values
    .map((value) => {
      if (!value) return null;
      if (value instanceof mongoose.Types.ObjectId) return value;
      if (!mongoose.Types.ObjectId.isValid(String(value))) return null;
      return new mongoose.Types.ObjectId(String(value));
    })
    .filter(Boolean);

async function getReviewSummaryMapForUsers(userIds = []) {
  const ids = toObjectIdList(userIds);
  if (!ids.length) return new Map();

  const rows = await CounselingReview.aggregate([
    { $match: { revieweeId: { $in: ids } } },
    {
      $group: {
        _id: "$revieweeId",
        averageRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  return new Map(
    rows.map((row) => [
      String(row._id),
      {
        averageRating: Number((row.averageRating || 0).toFixed(1)),
        reviewCount: row.reviewCount || 0,
      },
    ])
  );
}

async function getMyReviewMapForAppointments(reviewerId, appointmentIds = []) {
  const ids = toObjectIdList(appointmentIds);
  if (!reviewerId || !ids.length) return new Map();

  const reviews = await CounselingReview.find({
    reviewerId,
    appointmentId: { $in: ids },
  })
    .select("_id appointmentId rating comment createdAt")
    .sort({ createdAt: -1 });

  return new Map(
    reviews.map((review) => [
      String(review.appointmentId),
      {
        id: review._id,
        rating: review.rating,
        comment: review.comment || "",
        createdAt: review.createdAt,
      },
    ])
  );
}

async function getReceivedReviewsPayloadForUser(userId) {
  const summaryMap = await getReviewSummaryMapForUsers([userId]);
  const summary = summaryMap.get(String(userId)) || { averageRating: 0, reviewCount: 0 };

  const reviews = await CounselingReview.find({ revieweeId: userId })
    .populate("reviewerId", "fullName role")
    .populate("appointmentId", "month day slot status")
    .sort({ createdAt: -1 })
    .limit(10);

  return {
    summary,
    reviews: reviews.map((review) => ({
      id: review._id,
      rating: review.rating,
      comment: review.comment || "",
      createdAt: review.createdAt,
      reviewer: {
        id: review.reviewerId?._id,
        fullName: review.reviewerId?.fullName || "Anonymous",
        role: review.reviewerRole || review.reviewerId?.role || "",
      },
      appointment: review.appointmentId
        ? {
            id: review.appointmentId._id,
            month: review.appointmentId.month || "",
            day: review.appointmentId.day || "",
            slot: review.appointmentId.slot || "",
            status: review.appointmentId.status || "",
          }
        : null,
    })),
  };
}

/**
 * POST /api/counseling/requests
 */
exports.createCounselingRequest = async (req, res) => {
  try {
    const userId = getAuthId(req);
    const { problem, age, gender, language, mode, description } = req.body;

    if (!problem || !age || !gender || !language || !mode) {
      return res.status(400).json({
        ok: false,
        message: "problem, age, gender, language, mode are required",
      });
    }

    const nAge = Number(age);
    if (!Number.isFinite(nAge) || nAge <= 0) {
      return res.status(400).json({ ok: false, message: "age must be a valid number" });
    }

    const doc = await CounselingRequest.create({
      user: userId,
      problem: String(problem).trim(),
      age: nAge,
      gender,
      language,
      mode,
      description: String(description || "").trim(),
      status: "Open",
    });

    return res.status(201).json({
      ok: true,
      request: { _id: doc._id, id: doc._id, status: doc.status },
    });
  } catch (e) {
    return res.status(500).json({ ok: false, message: "Server error", error: e?.message });
  }
};

/**
 * GET /api/counseling/counsellors
 */
exports.listCounsellors = async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();

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

    const reviewSummaryMap = await getReviewSummaryMapForUsers(counsellors.map((c) => c._id));

    return res.json({
      ok: true,
      counsellors: counsellors.map((c) => ({
        id: c._id,
        _id: c._id,
        fullName: c.fullName,
        email: c.email,
        phone: c.phone || "",
        bio: c.bio || "",
        qualification: c.qualification || "",
        workingArea: c.workingArea || "",
        reviewSummary:
          reviewSummaryMap.get(String(c._id)) || {
            averageRating: 0,
            reviewCount: 0,
          },
      })),
    });
  } catch (e) {
    return res.status(500).json({ ok: false, message: "Server error", error: e?.message });
  }
};

/**
 * POST /api/counseling/appointments
 * body: { counsellorId, requestId, month, day, slot, notes }
 */
// controllers/counselingController.js

// controllers/counselingController.js

exports.bookCounselingAppointment = async (req, res) => {
  try {
    const userId = getAuthId(req);
    let { counsellorId, requestId, month = "December", day, slot, notes = "" } = req.body;

    // ✅ normalize so duplicates match exactly
    month = String(month || "").trim();
    slot = String(slot || "").trim();
    day = Number(day);

    if (!counsellorId || !requestId || !month || !day || !slot) {
      return res.status(400).json({
        ok: false,
        message: "counsellorId, requestId, month, day, slot required",
      });
    }

    if (!Number.isFinite(day) || day < 1 || day > 31) {
      return res.status(400).json({ ok: false, message: "day must be between 1 and 31" });
    }

    const counsellor = await User.findOne({
      _id: counsellorId,
      role: "counsellor",
      isActive: true,
    });
    if (!counsellor) return res.status(404).json({ ok: false, message: "Counsellor not found" });

    const reqDoc = await CounselingRequest.findOne({ _id: requestId, user: userId });
    if (!reqDoc) return res.status(404).json({ ok: false, message: "Counseling request not found" });

    // ✅ RULE 1 CHECK: counsellor already booked at that slot?
    const counsellorBusy = await CounselingAppointment.findOne({
      counsellorId,
      month,
      day,
      slot,
      status: { $in: ["pending", "confirmed"] },
    }).select("_id");

    if (counsellorBusy) {
      return res.status(409).json({
        ok: false,
        message: "That slot is already booked for this counsellor.",
      });
    }

    // ✅ RULE 2 CHECK: user already has a booking at that slot?
    const userBusy = await CounselingAppointment.findOne({
      userId,
      month,
      day,
      slot,
      status: { $in: ["pending", "confirmed"] },
    }).select("_id counsellorId");

    if (userBusy) {
      return res.status(409).json({
        ok: false,
        message: "You already have a session booked at this time. Please choose another slot.",
      });
    }

    // ✅ create booking (DB unique indexes still protect against race conditions)
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

    reqDoc.status = "Matched";
    reqDoc.counsellor = counsellorId;
    await reqDoc.save();

    return res.status(201).json({
      ok: true,
      appointment: {
        _id: appt._id,
        id: appt._id,
        status: appt.status,
        month,
        day,
        slot,
      },
    });
  } catch (e) {
    // ✅ If indexes block (duplicate key)
    if (e?.code === 11000) {
      // Try to infer which index failed
      const key = e?.keyPattern || {};
      if (key.userId) {
        return res.status(409).json({
          ok: false,
          message: "You already have a session booked at this time. Please choose another slot.",
        });
      }
      return res.status(409).json({
        ok: false,
        message: "That slot is already booked for this counsellor.",
      });
    }

    return res.status(500).json({ ok: false, message: "Failed to book appointment", error: e?.message });
  }
};


/**
 * ✅ GET /api/counseling/appointments/mine  (USER)
 */
exports.getMyCounselingAppointments = async (req, res) => {
  try {
    const userId = getAuthId(req);

    const appts = await CounselingAppointment.find({ userId })
      .populate("counsellorId", "fullName email phone workingArea qualification")
      .populate("requestId")
      .sort({ createdAt: -1 });

    const reviewSummaryMap = await getReviewSummaryMapForUsers(
      appts.map((a) => a?.counsellorId?._id).filter(Boolean)
    );
    const myReviewMap = await getMyReviewMapForAppointments(
      userId,
      appts.map((a) => a._id)
    );

    return res.json({
      ok: true,
      appointments: appts.map((a) => ({
        _id: a._id,
        id: a._id,
        month: a.month,
        day: a.day,
        slot: a.slot,
        status: a.status,
        createdAt: a.createdAt,
        counsellor: a.counsellorId
          ? {
              _id: a.counsellorId._id,
              id: a.counsellorId._id,
              fullName: a.counsellorId.fullName,
              email: a.counsellorId.email,
              phone: a.counsellorId.phone || "",
              workingArea: a.counsellorId.workingArea || "",
              qualification: a.counsellorId.qualification || "",
              reviewSummary:
                reviewSummaryMap.get(String(a.counsellorId._id)) || {
                  averageRating: 0,
                  reviewCount: 0,
                },
            }
          : null,
        requestId: a.requestId || null,
        myReview: myReviewMap.get(String(a._id)) || null,
      })),
    });
  } catch (e) {
    return res.status(500).json({ ok: false, message: "Failed to load your counselling bookings", error: e?.message });
  }
};

/**
 * ✅ GET /api/counseling/counsellor/appointments (COUNSELLOR)
 */
exports.getCounsellorAppointments = async (req, res) => {
  try {
    const counsellorId = getAuthId(req);

    const appts = await CounselingAppointment.find({ counsellorId })
      .populate("userId", "fullName email phone")
      .populate("requestId", "problem age gender language mode description")
      .sort({ createdAt: -1 });

    const reviewSummaryMap = await getReviewSummaryMapForUsers(
      appts.map((a) => a?.userId?._id).filter(Boolean)
    );
    const myReviewMap = await getMyReviewMapForAppointments(
      counsellorId,
      appts.map((a) => a._id)
    );

    return res.json({
      ok: true,
      appointments: appts.map((a) => ({
        _id: a._id,
        id: a._id,
        status: a.status,
        month: a.month,
        day: a.day,
        slot: a.slot,
        createdAt: a.createdAt,
        user: a.userId
          ? {
              id: a.userId._id,
              fullName: a.userId.fullName,
              email: a.userId.email,
              phone: a.userId.phone || "",
              reviewSummary:
                reviewSummaryMap.get(String(a.userId._id)) || {
                  averageRating: 0,
                  reviewCount: 0,
                },
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
        myReview: myReviewMap.get(String(a._id)) || null,
      })),
    });
  } catch (e) {
    return res.status(500).json({ ok: false, message: "Failed to load counsellor appointments", error: e?.message });
  }
};

/**
 * PATCH /api/counseling/appointments/:id/confirm
 */
exports.counsellorConfirmAppointment = async (req, res) => {
  try {
    const counsellorId = getAuthId(req);

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

/**
 * PATCH /api/counseling/appointments/:id/decline
 */
exports.counsellorDeclineAppointment = async (req, res) => {
  try {
    const counsellorId = getAuthId(req);

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

exports.counsellorCompleteAppointment = async (req, res) => {
  try {
    const counsellorId = getAuthId(req);

    const appt = await CounselingAppointment.findOne({ _id: req.params.id, counsellorId });
    if (!appt) return res.status(404).json({ ok: false, message: "Appointment not found" });

    if (appt.status !== "confirmed") {
      return res.status(400).json({ ok: false, message: `Cannot complete. Current status: ${appt.status}` });
    }

    appt.status = "completed";
    await appt.save();

    return res.json({ ok: true, appointment: { id: appt._id, status: appt.status } });
  } catch (e) {
    return res.status(500).json({ ok: false, message: "Failed to mark appointment complete" });
  }
};

exports.submitCounselingReview = async (req, res) => {
  try {
    const authId = getAuthId(req);
    const { id: appointmentId } = req.params;
    const numericRating = Number(req.body?.rating);
    const comment = String(req.body?.comment || "").trim();

    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ ok: false, message: "rating must be an integer from 1 to 5" });
    }

    const appointment = await CounselingAppointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ ok: false, message: "Appointment not found" });
    }

    if (appointment.status !== "completed") {
      return res.status(400).json({ ok: false, message: "Reviews are allowed only for completed appointments" });
    }

    let revieweeId = null;
    let reviewerRole = null;
    let revieweeRole = null;

    if (String(appointment.userId) === authId) {
      revieweeId = appointment.counsellorId;
      reviewerRole = "user";
      revieweeRole = "counsellor";
    } else if (String(appointment.counsellorId) === authId) {
      revieweeId = appointment.userId;
      reviewerRole = "counsellor";
      revieweeRole = "user";
    } else {
      return res.status(403).json({ ok: false, message: "You cannot review this appointment" });
    }

    const existing = await CounselingReview.findOne({ appointmentId, reviewerId: authId });
    if (existing) {
      return res.status(409).json({ ok: false, message: "You already reviewed this appointment" });
    }

    const review = await CounselingReview.create({
      appointmentId,
      reviewerId: authId,
      revieweeId,
      reviewerRole,
      revieweeRole,
      rating: numericRating,
      comment,
    });

    return res.status(201).json({
      ok: true,
      review: {
        id: review._id,
        rating: review.rating,
        comment: review.comment || "",
        createdAt: review.createdAt,
      },
    });
  } catch (e) {
    if (e?.code === 11000) {
      return res.status(409).json({ ok: false, message: "You already reviewed this appointment" });
    }
    return res.status(500).json({ ok: false, message: "Failed to submit review", error: e?.message });
  }
};

exports.getMyReceivedCounselingReviews = async (req, res) => {
  try {
    const authId = getAuthId(req);
    const payload = await getReceivedReviewsPayloadForUser(authId);
    return res.json({ ok: true, ...payload });
  } catch (e) {
    return res.status(500).json({ ok: false, message: "Failed to load reviews", error: e?.message });
  }
};
