const router = require("express").Router();

const auth = require("../middleware/auth");
const requireRole = require("../middleware/role");
const municipality = require("../controllers/municipalityController");

router.get(
  "/reports",
  auth,
  requireRole("municipality", "admin"),
  municipality.listMunicipalityReports
);

router.patch(
  "/reports/:id",
  auth,
  requireRole("municipality", "admin"),
  municipality.updateMunicipalityReport
);

module.exports = router;
