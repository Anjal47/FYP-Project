// routes/counselingRoutes.js
const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const ctrl = require("../controllers/counselingController");

// -------------------- USER FLOW --------------------
router.post("/requests", auth, ctrl.createCounselingRequest);
router.get("/counsellors", auth, ctrl.listCounsellors);

// booking flow (like therapy)
router.post("/appointments", auth, ctrl.bookCounselingAppointment);

// ✅ USER: my booked sessions (THIS is what your user screen should call)
router.get("/appointments/mine", auth, ctrl.getMyCounselingAppointments);
router.get("/reviews/me", auth, ctrl.getMyReceivedCounselingReviews);
router.post("/appointments/:id/review", auth, ctrl.submitCounselingReview);

// -------------------- COUNSELLOR DASHBOARD --------------------
// ✅ COUNSELLOR: see appointments assigned to this counsellor
router.get("/counsellor/appointments", auth, ctrl.getCounsellorAppointments);

// counsellor actions
router.patch("/appointments/:id/confirm", auth, ctrl.counsellorConfirmAppointment);
router.patch("/appointments/:id/decline", auth, ctrl.counsellorDeclineAppointment);
router.patch("/appointments/:id/complete", auth, ctrl.counsellorCompleteAppointment);

module.exports = router;
