// src/controllers/report.controller.js
const Report = require("../models/Report");
const { generateReportCode } = require("../utils/reportCode");

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

function buildMediaUrl(req, file) {
  if (!file) return "";
  return `${req.protocol}://${req.get("host")}/uploads/reports/${file.filename}`;
}

/**
 * Decide department from report type
 * - civic / infrastructure issues → municipality
 * - everything else → police
 */
function inferDepartmentFromType(type) {
  const t = String(type || "").toLowerCase().trim();

  const municipalityKeywords = [
    "waste",
    "garbage",
    "trash",
    "road",
    "pothole",
    "drain",
    "sewage",
    "water",
    "street light",
    "lighting",
  ];

  return municipalityKeywords.some((k) => t.includes(k))
    ? "municipality"
    : "police";
}

/* -------------------- POST /api/reports -------------------- */
exports.createReport = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }

    let { type, area, description, priority } = req.body || {};

    // React Native multipart requests can occasionally drop plain text fields.
    // Fall back to a serialized payload field when present.
    if ((!type || !area) && req.body?.payload) {
      try {
        const parsed = JSON.parse(String(req.body.payload));
        type = type || parsed?.type;
        area = area || parsed?.area;
        description = description || parsed?.description;
        priority = priority || parsed?.priority;
      } catch {
        // Ignore parse failures and continue with normal validation below.
      }
    }

    if (!type || !area) {
      return res
        .status(400)
        .json({ ok: false, message: "type and area required" });
    }

    const safePriority = ["Low", "Medium", "High"].includes(priority)
      ? priority
      : "Medium";

    const reportCode = await generateReportCode();
    const department = inferDepartmentFromType(type);

    const photoFile = req.files?.photo?.[0];
    const videoFile = req.files?.video?.[0];
    const audioFile = req.files?.audio?.[0];

    const report = await Report.create({
      createdBy: req.user._id,
      reportCode,
      department,
      type: String(type).trim(),
      area: String(area).trim(),
      description: description ? String(description).trim() : "",
      photoUrl: buildMediaUrl(req, photoFile),
      videoUrl: buildMediaUrl(req, videoFile),
      audioUrl: buildMediaUrl(req, audioFile),
      priority: safePriority,
      status: "Open",
      assignedTo: null,
    });

    return res.status(201).json({
      ok: true,
      message: "Report submitted",
      report: {
        _id: report._id,
        reportCode: report.reportCode,
        id: report.reportCode,
        department: report.department,
        type: report.type,
        area: report.area,
        description: report.description,
        photoUrl: report.photoUrl || "",
        videoUrl: report.videoUrl || "",
        audioUrl: report.audioUrl || "",
        priority: report.priority,
        status: report.status,
        createdAt: report.createdAt,
        time: timeAgo(report.createdAt),
      },
    });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
};

/* -------------------- GET /api/reports/mine -------------------- */
exports.getMyReports = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }

    const rows = await Report.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    const reports = rows.map((r) => ({
      _id: r._id,
      reportCode: r.reportCode,
      id: r.reportCode,
      department: r.department || "",
      type: r.type,
      area: r.area,
      description: r.description,
      photoUrl: r.photoUrl || "",
      videoUrl: r.videoUrl || "",
      audioUrl: r.audioUrl || "",
      priority: r.priority,
      status: r.status,
      createdAt: r.createdAt,
      time: timeAgo(r.createdAt),
    }));

    return res.json({ ok: true, reports });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
};

/* -------------------- GET /api/reports/status/:reportCode -------------------- */
exports.getReportStatusByCode = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }

    const reportCode = String(req.params.reportCode || "").trim();
    if (!reportCode) {
      return res
        .status(400)
        .json({ ok: false, message: "reportCode required" });
    }

    const report = await Report.findOne({ reportCode })
      .populate("assignedTo", "fullName role")
      .populate("createdBy", "fullName role")
      .lean();

    if (!report) {
      return res.status(404).json({ ok: false, message: "Report not found" });
    }

    const role = String(req.user.role || "");
    const dept = String(report.department || "");

    const isAdmin = role === "admin";
    const isOwner =
      String(report.createdBy?._id) === String(req.user._id);

    const canStaffView =
      (role === "police" && dept === "police") ||
      (role === "municipality" && dept === "municipality");

    if (!(isAdmin || isOwner || canStaffView)) {
      return res
        .status(403)
        .json({ ok: false, message: "Not allowed to view this report" });
    }

    return res.json({
      ok: true,
      report: {
        reportCode: report.reportCode,
        id: report.reportCode,
        department: report.department,
        type: report.type,
        area: report.area,
        description: report.description || "",
        photoUrl: report.photoUrl || "",
        videoUrl: report.videoUrl || "",
        audioUrl: report.audioUrl || "",
        priority: report.priority,
        status: report.status,
        assignedTo: report.assignedTo
          ? {
              fullName: report.assignedTo.fullName,
              role: report.assignedTo.role,
            }
          : null,
        createdAt: report.createdAt,
        time: timeAgo(report.createdAt),
      },
    });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
};
