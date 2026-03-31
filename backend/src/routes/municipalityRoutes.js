// src/routes/municipalityRoutes.js
const router = require("express").Router();

const auth = require("../middleware/auth");
const requireRole = require("../middleware/role");

// ✅ IMPORTANT: path must match your actual controller filename
const municipality = require("../controllers/municipalityController");

// --- QUICK SAFETY CHECK (so you instantly see what's undefined) ---
console.log("✅ municipalityRoutes loaded");
console.log("auth:", typeof auth);
console.log("requireRole:", typeof requireRole);
console.log("requireRole('municipality'):", typeof requireRole?.("municipality"));
console.log("municipality.listMunicipalityReports:", typeof municipality?.listMunicipalityReports);
console.log("municipality.updateMunicipalityReport:", typeof municipality?.updateMunicipalityReport);

// ✅ ROUTES
router.get(
  "/reports",
  auth,
  requireRole("municipality"),
  municipality.listMunicipalityReports
);

router.patch(
  "/reports/:id",
  auth,
  requireRole("municipality"),
  municipality.updateMunicipalityReport
);

module.exports = router;
