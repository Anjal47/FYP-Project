// src/controllers/adminReport.controller.js
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

/**
 * GET /api/admin/reports
 * Admin: view all reports (no edit)
 * Query:
 *  - status=All|Open|Assigned|Resolved
 *  - assigned=All|Assigned|Unassigned
 *  - department=All|police|municipality
 *  - q=search text (reportCode/type/area/createdBy name)
 */
exports.getAllReports = async (req, res) => {
  try {
    if (!req.user?._id || req.user.role !== "admin") {
      return res.status(403).json({ ok: false, message: "Admin only" });
    }

    const status = String(req.query.status || "All").trim();
    const assigned = String(req.query.assigned || "All").trim();
    const department = String(req.query.department || "All").trim();
    const q = String(req.query.q || "").trim();

    const filter = {};

    // status filter
    if (status !== "All") filter.status = status;

    // department filter
    if (department !== "All") filter.department = department;

    // assigned filter (based on assignedTo)
    if (assigned === "Assigned") filter.assignedTo = { $ne: null };
    if (assigned === "Unassigned") filter.assignedTo = null;

    // basic text search
    // (we’ll search reportCode/type/area, and also createdBy.fullName via populate match after)
    if (q) {
      filter.$or = [
        { reportCode: new RegExp(q, "i") },
        { type: new RegExp(q, "i") },
        { area: new RegExp(q, "i") },
      ];
    }

    const rows = await Report.find(filter)
      .sort({ createdAt: -1 })
      // ✅ IMPORTANT: populate the field that actually exists in schema
      .populate("assignedTo", "fullName role email")
      .populate("createdBy", "fullName role email")
      .lean();

    // If you want "q" to also match createdBy.fullName:
    const finalRows = q
      ? rows.filter((r) => {
          const name = String(r.createdBy?.fullName || "");
          return (
            name.toLowerCase().includes(q.toLowerCase()) ||
            (r.reportCode || "").toLowerCase().includes(q.toLowerCase()) ||
            (r.type || "").toLowerCase().includes(q.toLowerCase()) ||
            (r.area || "").toLowerCase().includes(q.toLowerCase())
          );
        })
      : rows;

    const reports = finalRows.map((r) => ({
      _id: r._id,
      reportCode: r.reportCode,
      id: r.reportCode,

      department: r.department || "",
      type: r.type,
      area: r.area,
      description: r.description || "",

      priority: r.priority,
      status: r.status,

      createdAt: r.createdAt,
      time: timeAgo(r.createdAt),

      createdBy: r.createdBy
        ? {
            _id: r.createdBy._id,
            fullName: r.createdBy.fullName,
            role: r.createdBy.role,
            email: r.createdBy.email,
          }
        : null,

      assignedTo: r.assignedTo
        ? {
            _id: r.assignedTo._id,
            fullName: r.assignedTo.fullName,
            role: r.assignedTo.role,
            email: r.assignedTo.email,
          }
        : null,
    }));

    return res.json({ ok: true, reports });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
};
