// src/routes/report.routes.js
const router = require("express").Router();
const auth = require("../middleware/auth");
const reportController = require("../controllers/report.controller");

// Create a report (requires login)
router.post("/", auth, reportController.createReport);

// Get my reports (requires login)
router.get("/mine", auth, reportController.getMyReports);

// Check status by reportCode (requires login + ownership/staff enforced in controller)
router.get("/status/:reportCode", auth, reportController.getReportStatusByCode);

// Optional quick test route
router.get("/ping", (req, res) => res.json({ ok: true, route: "reports" }));

module.exports = router;
