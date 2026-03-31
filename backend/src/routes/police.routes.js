// src/routes/police.routes.js
const router = require("express").Router();
const auth = require("../middleware/auth");
const requireRole = require("../middleware/role");
const police = require("../controllers/policeController");

router.get("/reports", auth, requireRole("police"), police.getPoliceReports);
router.get("/stats", auth, requireRole("police"), police.getPoliceStats);
router.get("/categories", auth, requireRole("police"), police.getCategoryCounts);
router.patch("/reports/:id", auth, requireRole("police"), police.updatePoliceReport);

module.exports = router;
