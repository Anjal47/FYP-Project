const router = require("express").Router();
const auth = require("../middleware/auth");
const requireRole = require("../middleware/role");
const ctrl = require("../controllers/trafficPay.controller");

router.post("/fines", auth, requireRole("police"), ctrl.createFine);
router.get("/fines/mine", auth, ctrl.getMyFines);
router.post("/payments/initiate", auth, ctrl.initiatePayment);
router.post("/payments/verify", auth, ctrl.verifyPayment);
router.get("/payments/:paymentId/esewa", ctrl.renderEsewaForm);
router.get("/payments/esewa/success", ctrl.handleEsewaSuccess);
router.get("/payments/esewa/failure", ctrl.handleEsewaFailure);

module.exports = router;
