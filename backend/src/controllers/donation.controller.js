const DonationRequest = require("../models/DonationRequest");

const getAuthId = (req) => String(req?.user?._id || req?.user?.id || "");

const buildFileUrl = (req, file) => {
  if (!file) return "";
  return `${req.protocol}://${req.get("host")}/uploads/donations/${file.filename}`;
};

/**
 * POST /api/donations
 * Logged-in user creates a donation request
 */
exports.createDonationRequest = async (req, res) => {
  try {
    const userId = getAuthId(req);

    if (!userId) {
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }

    const {
      fullName,
      contact,
      location,
      helpType,
      description,
      amountNeeded,
      urgency,
    } = req.body || {};

    if (
      !fullName ||
      !contact ||
      !location ||
      !helpType ||
      !description ||
      !amountNeeded
    ) {
      return res.status(400).json({
        ok: false,
        message:
          "fullName, contact, location, helpType, description, amountNeeded are required",
      });
    }

    const safeAmount = Number(amountNeeded);
    if (!Number.isFinite(safeAmount) || safeAmount <= 0) {
      return res.status(400).json({
        ok: false,
        message: "amountNeeded must be a valid number greater than 0",
      });
    }

    const safeUrgency = ["Low", "Medium", "Urgent"].includes(String(urgency || ""))
      ? String(urgency)
      : "Medium";

    const qrImageFile = req.files?.qrImage?.[0];
    const proofImageFile = req.files?.proofImage?.[0];
    const proofVideoFile = req.files?.proofVideo?.[0];

    const donation = await DonationRequest.create({
      fullName: String(fullName).trim(),
      contact: String(contact).trim(),
      location: String(location).trim(),
      helpType: String(helpType).trim(),
      description: String(description).trim(),
      amountNeeded: safeAmount,
      urgency: safeUrgency,
      qrImage: buildFileUrl(req, qrImageFile),
      proofImage: buildFileUrl(req, proofImageFile),
      proofVideo: buildFileUrl(req, proofVideoFile),
      status: "pending",
      createdBy: userId,
    });

    return res.status(201).json({
      ok: true,
      message: "Donation request submitted for admin approval",
      donation: {
        _id: donation._id,
        id: donation._id,
        fullName: donation.fullName,
        contact: donation.contact,
        location: donation.location,
        helpType: donation.helpType,
        description: donation.description,
        amountNeeded: donation.amountNeeded,
        urgency: donation.urgency,
        qrImage: donation.qrImage,
        proofImage: donation.proofImage,
        proofVideo: donation.proofVideo,
        status: donation.status,
        createdAt: donation.createdAt,
      },
    });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      message: "Failed to submit donation request",
      error: e?.message,
    });
  }
};

/**
 * GET /api/donations/approved
 * Public-for-logged-in-users approved donation list
 */
exports.getApprovedDonations = async (req, res) => {
  try {
    const donations = await DonationRequest.find({ status: "approved" })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      ok: true,
      donations: donations.map((d) => ({
        _id: d._id,
        id: d._id,
        fullName: d.fullName,
        contact: d.contact,
        location: d.location,
        helpType: d.helpType,
        description: d.description,
        amountNeeded: d.amountNeeded,
        urgency: d.urgency,
        qrImage: d.qrImage || "",
        proofImage: d.proofImage || "",
        proofVideo: d.proofVideo || "",
        status: d.status,
        adminNotes: d.adminNotes || "",
        createdAt: d.createdAt,
      })),
    });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      message: "Failed to load approved donations",
      error: e?.message,
    });
  }
};

/**
 * GET /api/donations/pending
 * Admin sees pending requests
 */
exports.getPendingDonations = async (req, res) => {
  try {
    const donations = await DonationRequest.find({ status: "pending" })
      .populate("createdBy", "fullName email role")
      .sort({ createdAt: -1 });

    return res.json({
      ok: true,
      donations: donations.map((d) => ({
        _id: d._id,
        id: d._id,
        fullName: d.fullName,
        contact: d.contact,
        location: d.location,
        helpType: d.helpType,
        description: d.description,
        amountNeeded: d.amountNeeded,
        urgency: d.urgency,
        qrImage: d.qrImage || "",
        proofImage: d.proofImage || "",
        proofVideo: d.proofVideo || "",
        status: d.status,
        adminNotes: d.adminNotes || "",
        createdAt: d.createdAt,
        createdBy: d.createdBy
          ? {
              _id: d.createdBy._id,
              fullName: d.createdBy.fullName,
              email: d.createdBy.email,
              role: d.createdBy.role,
            }
          : null,
      })),
    });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      message: "Failed to load pending donations",
      error: e?.message,
    });
  }
};

/**
 * PATCH /api/donations/:id/approve
 * Admin approves request
 */
exports.approveDonationRequest = async (req, res) => {
  try {
    const { adminNotes = "" } = req.body || {};

    const donation = await DonationRequest.findById(req.params.id);
    if (!donation) {
      return res.status(404).json({ ok: false, message: "Donation request not found" });
    }

    donation.status = "approved";
    donation.adminNotes = String(adminNotes || "").trim();
    await donation.save();

    return res.json({
      ok: true,
      message: "Donation request approved",
      donation: {
        _id: donation._id,
        id: donation._id,
        status: donation.status,
        adminNotes: donation.adminNotes,
      },
    });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      message: "Failed to approve donation request",
      error: e?.message,
    });
  }
};

/**
 * PATCH /api/donations/:id/reject
 * Admin rejects request
 */
exports.rejectDonationRequest = async (req, res) => {
  try {
    const { adminNotes = "" } = req.body || {};

    const donation = await DonationRequest.findById(req.params.id);
    if (!donation) {
      return res.status(404).json({ ok: false, message: "Donation request not found" });
    }

    donation.status = "rejected";
    donation.adminNotes = String(adminNotes || "").trim();
    await donation.save();

    return res.json({
      ok: true,
      message: "Donation request rejected",
      donation: {
        _id: donation._id,
        id: donation._id,
        status: donation.status,
        adminNotes: donation.adminNotes,
      },
    });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      message: "Failed to reject donation request",
      error: e?.message,
    });
  }
};