const router = require("express").Router();
const auth = require("../middleware/auth");
const Report = require("../models/Report");

// user creates report
router.post("/", auth, async (req, res, next) => {
  try {
    const { type, area, description, priority } = req.body || {};
    if (!type || !area) return res.status(400).json({ ok: false, message: "type and area required" });

    const r = await Report.create({
      createdBy: req.user._id,
      type,
      area,
      description: description || "",
      priority: priority || "Medium",
      status: "Open",
    });

    res.status(201).json({ ok: true, report: r });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
