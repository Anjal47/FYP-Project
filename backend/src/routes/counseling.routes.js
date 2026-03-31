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

// -------------------- COUNSELLOR DASHBOARD --------------------
// ✅ COUNSELLOR: see appointments assigned to this counsellor
router.get("/counsellor/appointments", auth, ctrl.getCounsellorAppointments);

// counsellor actions
router.patch("/appointments/:id/confirm", auth, ctrl.counsellorConfirmAppointment);
router.patch("/appointments/:id/decline", auth, ctrl.counsellorDeclineAppointment);

module.exports = router;
