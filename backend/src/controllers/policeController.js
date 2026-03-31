// src/controllers/police.controller.js
const Report = require("../models/Report");

/* -------------------- Helpers -------------------- */
function timeAgo(date) {
  const diffMs = Date.now() - new Date(date).getTime();
  const s = Math.floor(diffMs / 1000);
  if (s < 60) return `${s} sec ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hrs ago`;
  const d = Math.floor(h / 24);
  return `${d} days ago`;
}

function requirePolice(req) {
  if (!req.user) return { ok: false, code: 401, message: "Missing auth user" };
  if (req.user.role !== "police") return { ok: false, code: 403, message: "Police only" };
  return null;
}

/**
 * Municipality keywords (fallback filter only)
 * If your Report has department, we use department instead (recommended).
 */
const MUNICIPALITY_KEYWORDS = [
  "road",
  "pothole",
  "street light",
  "traffic light",
  "drain",
  "drainage",
  "sewage",
  "garbage",
  "trash",
  "waste",
  "litter",
];

function isMunicipalityType(type) {
  const t = String(type || "").toLowerCase();
  return MUNICIPALITY_KEYWORDS.some((k) => t.includes(k));
}

/**
 * ✅ BEST FILTER:
 * If department exists, police should only see department=police.
 * ✅ FALLBACK:
 * If older reports have no department, exclude municipality keywords from type.
 */
function buildPoliceBaseFilter() {
  const keywordExclude = {
    $and: MUNICIPALITY_KEYWORDS.map((k) => ({
      type: { $not: { $regex: k, $options: "i" } },
    })),
  };

  return {
    $or: [
      { department: "police" }, // ✅ correct modern filter
      { department: { $exists: false }, ...keywordExclude }, // ✅ fallback for old docs
      { department: "" , ...keywordExclude }, // optional fallback if some docs store empty
    ],
  };
}

/* -------------------- GET /api/police/reports -------------------- */
exports.getPoliceReports = async (req, res) => {
  try {
    const guard = requirePolice(req);
    if (guard) return res.status(guard.code).json({ ok: false, message: guard.message });

    const status = String(req.query.status || "All").trim();
    const q = String(req.query.q || "").trim();
    const priority = String(req.query.priority || "").trim();

    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10), 1), 50);

    const filter = buildPoliceBaseFilter();

    if (status !== "All") filter.status = status;
    if (priority) filter.priority = priority;

    if (q) {
      const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const rx = new RegExp(safe, "i");
      filter.$or = [
        ...(filter.$or || []),
        { reportCode: rx },
        { type: rx },
        { area: rx },
        { description: rx },
        { priority: rx },
        { status: rx },
      ];
    }

    const total = await Report.countDocuments(filter);

    const rows = await Report.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("createdBy", "fullName email role")
      .populate("assignedTo", "fullName email role")
      .lean();

    const reports = rows.map((r) => ({
      _id: r._id,
      id: r.reportCode, // UI uses r.id
      reportCode: r.reportCode,
      department: r.department || "",
      type: r.type,
      title: r.type,
      area: r.area,
      description: r.description || "",
      priority: r.priority,
      status: r.status,
      time: timeAgo(r.createdAt),
      createdAt: r.createdAt,
      createdBy: r.createdBy ? { _id: r.createdBy._id, fullName: r.createdBy.fullName } : null,
      assignedTo: r.assignedTo ? { _id: r.assignedTo._id, fullName: r.assignedTo.fullName } : null,
    }));

    return res.json({ ok: true, page, limit, total, reports });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
};

/* -------------------- GET /api/police/stats -------------------- */
exports.getPoliceStats = async (req, res) => {
  try {
    const guard = requirePolice(req);
    if (guard) return res.status(guard.code).json({ ok: false, message: guard.message });

    const base = buildPoliceBaseFilter();

    const [open, assigned, resolved] = await Promise.all([
      Report.countDocuments({ ...base, status: "Open" }),
      Report.countDocuments({ ...base, status: "Assigned" }),
      Report.countDocuments({ ...base, status: "Resolved" }),
    ]);

    return res.json({ ok: true, stats: { open, assigned, resolved } });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
};

/* -------------------- GET /api/police/categories -------------------- */
exports.getCategoryCounts = async (req, res) => {
  try {
    const guard = requirePolice(req);
    if (guard) return res.status(guard.code).json({ ok: false, message: guard.message });

    const base = buildPoliceBaseFilter();

    const rows = await Report.aggregate([
      { $match: base },
      { $group: { _id: "$type", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const categories = rows.map((r) => ({ type: r._id, count: r.count }));
    return res.json({ ok: true, categories });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
};

/* -------------------- PATCH /api/police/reports/:id -------------------- */
exports.updatePoliceReport = async (req, res) => {
  try {
    const guard = requirePolice(req);
    if (guard) return res.status(guard.code).json({ ok: false, message: guard.message });

    const { id } = req.params;
    const { action } = req.body || {};
    if (!action) return res.status(400).json({ ok: false, message: "action is required" });

    const report = await Report.findById(id);
    if (!report) return res.status(404).json({ ok: false, message: "Report not found" });

    // ✅ Must be police report (if department exists)
    if (report.department && report.department !== "police") {
      return res.status(403).json({ ok: false, message: "Not a police report" });
    }

    // ✅ Fallback blocking (if no department stored)
    if (!report.department && isMunicipalityType(report.type)) {
      return res
        .status(403)
        .json({ ok: false, message: "This is a municipality complaint (not a police report)" });
    }

    if (action === "assignToMe") {
      report.assignedTo = req.user._id;
      report.status = "Assigned";
      await report.save();
      return res.json({ ok: true, message: "Assigned", report });
    }

    if (action === "resolve") {
      report.status = "Resolved";
      await report.save();
      return res.json({ ok: true, message: "Resolved", report });
    }

    return res.status(400).json({ ok: false, message: "Invalid action" });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
};
