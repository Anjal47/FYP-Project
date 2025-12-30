const router = require("express").Router();
const auth = require("../middleware/auth");
const requireRole = require("../middleware/role");
const c = require("../controllers/admin.controller");

/* ================= DASHBOARD ================= */
router.get("/stats", auth, requireRole("admin"), c.getStats);

/* ================= USERS ================= */
router.get("/users", auth, requireRole("admin"), c.listUsers);
router.patch("/users/:id/toggle", auth, requireRole("admin"), c.toggleUser);

/* ================= STAFF ================= */
router.post("/staff", auth, requireRole("admin"), c.createStaff);
router.get("/staff", auth, requireRole("admin"), c.listStaff);
router.patch("/staff/:id", auth, requireRole("admin"), c.updateStaff);
router.delete("/staff/:id", auth, requireRole("admin"), c.deleteStaff);
router.get("/reports", auth, requireRole("admin"), c.listReports);
router.patch("/reports/:id", auth, requireRole("admin"), c.updateReport);
router.get("/reports/:id/pdf", auth, requireRole("admin"), c.downloadReportPDF);

module.exports = router;
