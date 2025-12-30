const router = require("express").Router();
const auth = require("../middleware/auth");
const c = require("../controllers/therapy.controller");

console.log("✅ therapy.routes.js loaded");

router.post("/requests", auth, c.createTherapyRequest);
router.get("/therapists", auth, c.listTherapists);
router.post("/appointments", auth, c.bookAppointment);
router.get("/therapist/appointments", auth, c.getTherapistAppointments);
router.patch("/therapist/appointments/:id/status", auth, c.updateTherapistAppointmentStatus);
router.get("/my/appointments", auth, c.getMyTherapyAppointments);
// therapist actions (auth required)
router.patch("/appointments/:id/confirm", auth, c.therapistConfirmAppointment);
router.patch("/appointments/:id/decline", auth, c.therapistDeclineAppointment);

module.exports = router;
