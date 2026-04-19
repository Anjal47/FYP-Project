// src/controllers/municipalityController.js
const Report = require("../models/Report");

/* -------------------- Municipality keywords -------------------- */
const MUNICIPALITY_KEYWORDS = [
  "road",
  "pothole",
  "street light",
  "traffic light",
  "drain",
  "drainage",
  "sewage",
  "waste",
  "garbage",
  "trash",
  "litter",
  "water",
  "lighting",
];

function isMunicipalityType(type) {
  const t = String(type || "").toLowerCase();
  return MUNICIPALITY_KEYWORDS.some((k) => t.includes(k));
}

/**
 * GET /api/municipality/reports
 * Query:
 *  - mode=assigned | all
 *  - status=All | Open | Assigned | Resolved
 *  - category=All | Waste | Road
 *  - q=search text
 */
exports.listMunicipalityReports = async (req, res, next) => {
  try {
    const mode = String(req.query.mode || "assigned");
    const q = String(req.query.q || "").trim();
    const status = String(req.query.status || "All");
    const category = String(req.query.category || "All");

    // ✅ Only municipality-like reports:
    // include true municipality department OR type looks municipality
    const filter = {
      $or: [{ department: "municipality" }, { type: { $regex: MUNICIPALITY_KEYWORDS.join("|"), $options: "i" } }],
    };

    // ✅ category filter
    if (category === "Waste") {
      filter.type = { $regex: /waste|garbage|trash|litter|drain|drainage|sewage/i };
    } else if (category === "Road") {
      filter.type = { $regex: /road|pothole|street light|traffic light|lighting/i };
    }

    if (status !== "All") filter.status = status;

    // ✅ assigned mode
    if (mode === "assigned") {
      filter.assignedTo = req.user._id;
    }

    if (q) {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { reportCode: { $regex: q, $options: "i" } },
          { type: { $regex: q, $options: "i" } },
          { area: { $regex: q, $options: "i" } },
          { description: { $regex: q, $options: "i" } },
          { priority: { $regex: q, $options: "i" } },
          { status: { $regex: q, $options: "i" } },
        ],
      });
    }

    const rows = await Report.find(filter)
      .populate("createdBy", "fullName email role")
      .populate("assignedTo", "fullName email role")
      .sort({ createdAt: -1 })
      .lean();

    const reports = rows.map((r) => ({
      ...r,
      geoLocation: r.geoLocation || null,
    }));

    return res.json({ ok: true, reports });
  } catch (e) {
    next(e);
  }
};

/**
 * PATCH /api/municipality/reports/:id
 * Body:
 *  - take:true  (assign to me)
 *  - status:"Resolved" (only if assigned to me)
 */
exports.updateMunicipalityReport = async (req, res, next) => {
  try {
    const { status, take } = req.body || {};

    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ ok: false, message: "Report not found" });

    // ✅ AUTO-FIX: if it LOOKS like municipality, force department to municipality
    const looksMunicipality = isMunicipalityType(report.type);
    if (report.department !== "municipality") {
      if (!looksMunicipality) {
        return res.status(403).json({ ok: false, message: "Not a municipality complaint" });
      }
      report.department = "municipality"; // ✅ convert old/incorrect records
    }

    // ✅ TAKE (assign to me)
    if (take === true) {
      if (report.assignedTo) return res.status(400).json({ ok: false, message: "Already assigned" });
      report.assignedTo = req.user._id;
      if (report.status === "Open") report.status = "Assigned";
    }

    // ✅ resolve only if assigned to me
    if (status === "Resolved") {
      if (!report.assignedTo || String(report.assignedTo) !== String(req.user._id)) {
        return res.status(403).json({ ok: false, message: "Not assigned to you" });
      }
      report.status = "Resolved";
    }

    await report.save();

    const updated = await Report.findById(report._id)
      .populate("createdBy", "fullName email role")
      .populate("assignedTo", "fullName email role");

    return res.json({ ok: true, report: updated });
  } catch (e) {
    next(e);
  }
};
