// src/routes/adminReport.routes.js
const router = require("express").Router();
const { getAllReports } = require("../controllers/adminReport.controller");
const auth = require("../middleware/auth");

router.get("/reports", auth, getAllReports);

module.exports = router;
