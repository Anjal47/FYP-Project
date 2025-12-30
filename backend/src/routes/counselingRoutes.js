const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const ctrl = require("../controllers/counselingController");

// user flow
router.post("/requests", auth, ctrl.createCounselingRequest);
router.get("/counsellors", auth, ctrl.listCounsellors);

// booking flow (like therapy)
router.post("/appointments", auth, ctrl.bookCounselingAppointment);
router.get("/my/appointments", auth, ctrl.getMyCounselingAppointments);

// counsellor dashboard
router.get("/counsellor/appointments", auth, ctrl.getCounsellorAppointments);

// counsellor actions
router.patch("/appointments/:id/confirm", auth, ctrl.counsellorConfirmAppointment);
router.patch("/appointments/:id/decline", auth, ctrl.counsellorDeclineAppointment);

module.exports = router;
