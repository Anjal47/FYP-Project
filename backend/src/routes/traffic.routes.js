const router = require("express").Router();
const auth = require("../middleware/auth");
const requireRole = require("../middleware/role");
const ctrl = require("../controllers/trafficPay.controller");

router.post("/fines", auth, requireRole("police"), ctrl.createFine);
router.get("/fines/mine", auth, ctrl.getMyFines);
router.post("/payments/initiate", auth, ctrl.initiatePayment);
router.post("/payments/verify", auth, ctrl.verifyPayment);
router.get("/payments/stripe/success", ctrl.handleStripeSuccess);
router.get("/payments/stripe/cancel", ctrl.handleStripeCancel);

module.exports = router;
