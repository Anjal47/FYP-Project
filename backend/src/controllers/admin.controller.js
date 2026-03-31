const bcrypt = require("bcrypt");
const User = require("../models/User");
const PDFDocument = require("pdfkit");
const Report = require("../models/Report");

/* ================= DASHBOARD STATS ================= */
exports.getStats = async (req, res, next) => {
  try {
    const users = await User.countDocuments({ role: "user" });
    const counsellors = await User.countDocuments({ role: "counsellor" });
    const therapists = await User.countDocuments({ role: "therapist" });
    const police = await User.countDocuments({ role: "police" });
    const municipality = await User.countDocuments({ role: "municipality" });

    res.json({
      ok: true,
      stats: {
        users,
        counsellors,
        therapists,
        police,
        municipality,
        staff: counsellors + therapists + police + municipality,
        openReports: 0, // 🔜 hook to Reports model later
      },
    });
  } catch (e) {
    next(e);
  }
};

/* ================= USERS ================= */
exports.listUsers = async (req, res, next) => {
  try {
    const users = await User.find({ role: "user" })
      .select("-passwordHash")
      .sort({ createdAt: -1 });

    res.json({ ok: true, users });
  } catch (e) {
    next(e);
  }
};

exports.toggleUser = async (req, res, next) => {
  try {
    const u = await User.findById(req.params.id);
    if (!u) return res.status(404).json({ ok: false, message: "User not found" });

    u.isActive = !u.isActive;
    await u.save();

    res.json({ ok: true, isActive: u.isActive });
  } catch (e) {
    next(e);
  }
};

/* ================= STAFF ================= */
// ✅ Added "municipality" role
const STAFF_ROLES = ["counsellor", "therapist", "police", "municipality"]; // ✅ add municipality


exports.createStaff = async (req, res, next) => {
  try {
    const { fullName, email, password, role, qualification, workingArea, phone, bio } = req.body;

    if (!STAFF_ROLES.includes(role)) {
      return res.status(400).json({ ok: false, message: "Invalid staff role" });
    }

    if (!fullName || !email || !password) {
      return res.status(400).json({ ok: false, message: "Missing required fields" });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ ok: false, message: "Email already exists" });

    const passwordHash = await bcrypt.hash(password, 10);

    const staff = await User.create({
      fullName,
      email,
      passwordHash,
      role,
      qualification: qualification || "",
      workingArea: workingArea || "",
      phone: phone || "",
      bio: bio || "",
    });

    res.status(201).json({
      ok: true,
      staff: {
        id: staff._id,
        fullName: staff.fullName,
        email: staff.email,
        role: staff.role,
      },
    });
  } catch (e) {
    next(e);
  }
};

exports.listStaff = async (req, res, next) => {
  try {
    const staff = await User.find({ role: { $in: STAFF_ROLES } })
      .select("-passwordHash")
      .sort({ createdAt: -1 });

    res.json({ ok: true, staff });
  } catch (e) {
    next(e);
  }
};

exports.updateStaff = async (req, res, next) => {
  try {
    const u = await User.findById(req.params.id);
    if (!u) return res.status(404).json({ ok: false, message: "Staff not found" });

    const { fullName, qualification, workingArea, phone, bio } = req.body;

    if (fullName !== undefined) u.fullName = fullName;
    if (qualification !== undefined) u.qualification = qualification;
    if (workingArea !== undefined) u.workingArea = workingArea;
    if (phone !== undefined) u.phone = phone;
    if (bio !== undefined) u.bio = bio;

    await u.save();
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};

exports.deleteStaff = async (req, res, next) => {
  try {
    const u = await User.findById(req.params.id);
    if (!u) return res.status(404).json({ ok: false, message: "Staff not found" });

    await u.deleteOne();
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};

/* ================= REPORTS ================= */
/* ================= REPORTS (VIEW ONLY) ================= */
exports.listReports = async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();
    const status = String(req.query.status || "All").trim();

    const filter = {};
    if (status !== "All") filter.status = status;

    if (q) {
      filter.$or = [
        { reportCode: { $regex: q, $options: "i" } },
        { type: { $regex: q, $options: "i" } },
        { area: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ];
    }

    const reports = await Report.find(filter)
      .populate("createdBy", "fullName email role")
      .populate("assignedTo", "fullName email role") // ✅ FIX
      .sort({ createdAt: -1 });

    res.json({ ok: true, reports });
  } catch (e) {
    next(e);
  }
};


/**
 * PATCH /api/admin/reports/:id
 * Body: { status?, priority?, assignedPolice?, adminNotes? }
 */
exports.updateReport = async (req, res, next) => {
  try {
    const { status, priority, assignedPolice, adminNotes } = req.body || {};

    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ ok: false, message: "Report not found" });

    if (status !== undefined) report.status = status;
    if (priority !== undefined) report.priority = priority;
    if (adminNotes !== undefined) report.adminNotes = adminNotes;

    // ✅ allow assignment to police OR municipality
    // inside exports.updateReport (admin)
if (assignedPolice !== undefined) {
  if (assignedPolice === null || assignedPolice === "") {
    report.assignedPolice = null;
  } else {
    const staffUser = await User.findById(assignedPolice);
    if (!staffUser) return res.status(404).json({ ok: false, message: "Staff user not found" });

    if (!["police", "municipality"].includes(staffUser.role)) {
      return res.status(400).json({ ok: false, message: "assignedPolice must be police or municipality" });
    }

    report.assignedPolice = staffUser._id;
    if (report.status === "Open") report.status = "Assigned";
  }
}


    await report.save();

    const updated = await Report.findById(report._id)
      .populate("createdBy", "fullName email role")
      .populate("assignedPolice", "fullName email role");

    res.json({ ok: true, report: updated });
  } catch (e) {
    next(e);
  }
};

/**
 * GET /api/admin/reports/:id/pdf
 * Generates a clean PDF summary for the report
 */
exports.downloadReportPDF = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate("createdBy", "fullName email role")
      .populate("assignedTo", "fullName email role") // ✅ FIXED
      .lean();

    if (!report) {
      return res.status(404).json({ ok: false, message: "Report not found" });
    }

    const fileName = `AngelTouch_Report_${report._id}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    doc.pipe(res);

    doc.fontSize(20).text("AngelTouch — Report Summary").moveDown(1);
    doc.fontSize(10).fillColor("gray").text(`Generated: ${new Date().toLocaleString()}`);
    doc.moveDown(1).fillColor("black");

    const line = (label, value) => {
      doc.font("Helvetica-Bold").text(`${label}: `, { continued: true });
      doc.font("Helvetica").text(value || "—");
    };

    line("Report ID", report.reportCode || report._id);
    line("Type", report.type);
    line("Area", report.area);
    line("Priority", report.priority);
    line("Status", report.status);
    line(
      "Created By",
      report.createdBy
        ? `${report.createdBy.fullName} (${report.createdBy.email})`
        : "—"
    );

    line(
      "Assigned Staff",
      report.assignedTo
        ? `${report.assignedTo.fullName} (${report.assignedTo.email}) — ${report.assignedTo.role}`
        : "Not assigned"
    );

    doc.moveDown(1);
    doc.font("Helvetica-Bold").text("Description");
    doc.font("Helvetica").text(report.description || "—");

    doc.end();
  } catch (err) {
    console.error("PDF ERROR:", err); // 👈 THIS would show assignedPolice crash
    next(err);
  }
};

