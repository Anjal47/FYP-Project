const DonationRequest = require("../models/DonationRequest");

const getAuthId = (req) => String(req?.user?._id || req?.user?.id || "");
const isAdmin = (req) => String(req?.user?.role || "").toLowerCase() === "admin";

const buildFileUrl = (req, file) => {
  if (!file) return "";
  return `${req.protocol}://${req.get("host")}/uploads/donations/${file.filename}`;
};

function computeDonationProgress(donation) {
  const amountNeeded = Number(donation?.amountNeeded || 0);
  const raisedAmount = Math.max(0, Number(donation?.raisedAmount || 0));
  const donorCount = Math.max(0, Number(donation?.donorCount || 0));
  const remainingAmount = Math.max(0, amountNeeded - raisedAmount);
  const progressPercent = amountNeeded > 0 ? Math.min(100, Math.round(raisedAmount / amountNeeded * 10000) / 100) : 0;
  const isFunded = amountNeeded > 0 && raisedAmount >= amountNeeded;
  return {
    amountNeeded,
    raisedAmount,
    donorCount,
    remainingAmount,
    progressPercent,
    isFunded
  };
}

function serializeCreator(createdBy) {
  if (!createdBy) return null;
  return {
    _id: createdBy._id,
    fullName: createdBy.fullName,
    email: createdBy.email,
    role: createdBy.role
  };
}

function serializeDonation(donation, options = {}) {
  const {
    includeCreator = false
  } = options;
  const progress = computeDonationProgress(donation);
  const payload = {
    _id: donation._id,
    id: donation._id,
    fullName: donation.fullName,
    contact: donation.contact,
    location: donation.location,
    helpType: donation.helpType,
    description: donation.description,
    amountNeeded: progress.amountNeeded,
    urgency: donation.urgency,
    qrImage: donation.qrImage || "",
    proofImage: donation.proofImage || "",
    proofVideo: donation.proofVideo || "",
    adminNotes: donation.adminNotes || "",
    status: donation.status,
    isClosed: Boolean(donation.isClosed),
    closedAt: donation.closedAt || null,
    createdAt: donation.createdAt,
    updatedAt: donation.updatedAt,
    ...progress
  };

  if (includeCreator) {
    payload.createdBy = serializeCreator(donation.createdBy);
  }

  return payload;
}

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
      urgency
    } = req.body || {};

    if (!fullName || !contact || !location || !helpType || !description || !amountNeeded) {
      return res.status(400).json({
        ok: false,
        message: "fullName, contact, location, helpType, description, amountNeeded are required"
      });
    }

    const safeAmount = Number(amountNeeded);
    if (!Number.isFinite(safeAmount) || safeAmount <= 0) {
      return res.status(400).json({
        ok: false,
        message: "amountNeeded must be a valid number greater than 0"
      });
    }

    const safeUrgency = ["Low", "Medium", "Urgent"].includes(String(urgency || "")) ? String(urgency) : "Medium";

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
      raisedAmount: 0,
      donorCount: 0,
      urgency: safeUrgency,
      qrImage: buildFileUrl(req, qrImageFile),
      proofImage: buildFileUrl(req, proofImageFile),
      proofVideo: buildFileUrl(req, proofVideoFile),
      status: "pending",
      isClosed: false,
      closedAt: null,
      createdBy: userId
    });

    return res.status(201).json({
      ok: true,
      message: "Donation request submitted for admin approval",
      donation: serializeDonation(donation)
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Failed to submit donation request",
      error: error?.message
    });
  }
};

/**
 * GET /api/donations/approved
 * Logged-in users browse approved and still-open requests
 */
exports.getApprovedDonations = async (req, res) => {
  try {
    const donations = await DonationRequest.find({
      status: "approved",
      isClosed: false
    }).sort({
      createdAt: -1
    }).lean();

    return res.json({
      ok: true,
      donations: donations.map(donation => serializeDonation(donation))
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Failed to load approved donations",
      error: error?.message
    });
  }
};

/**
 * GET /api/donations/mine
 * Requester sees their own donation requests and progress
 */
exports.getMyDonationRequests = async (req, res) => {
  try {
    const userId = getAuthId(req);
    if (!userId) {
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }

    const donations = await DonationRequest.find({
      createdBy: userId
    }).sort({
      createdAt: -1
    }).lean();

    return res.json({
      ok: true,
      donations: donations.map(donation => serializeDonation(donation))
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Failed to load your donation requests",
      error: error?.message
    });
  }
};

/**
 * GET /api/donations/manage
 * Admin sees all donation requests, across statuses
 */
exports.getAdminDonations = async (req, res) => {
  try {
    const donations = await DonationRequest.find({}).populate("createdBy", "fullName email role").sort({
      createdAt: -1
    });

    return res.json({
      ok: true,
      donations: donations.map(donation => serializeDonation(donation, {
        includeCreator: true
      }))
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Failed to load donation requests",
      error: error?.message
    });
  }
};

/**
 * GET /api/donations/pending
 * Admin sees pending requests
 */
exports.getPendingDonations = async (req, res) => {
  try {
    const donations = await DonationRequest.find({
      status: "pending",
      isClosed: false
    }).populate("createdBy", "fullName email role").sort({
      createdAt: -1
    });

    return res.json({
      ok: true,
      donations: donations.map(donation => serializeDonation(donation, {
        includeCreator: true
      }))
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Failed to load pending donations",
      error: error?.message
    });
  }
};

/**
 * PATCH /api/donations/:id/approve
 * Admin approves request
 */
exports.approveDonationRequest = async (req, res) => {
  try {
    const {
      adminNotes = ""
    } = req.body || {};

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
      donation: serializeDonation(donation)
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Failed to approve donation request",
      error: error?.message
    });
  }
};

/**
 * PATCH /api/donations/:id/reject
 * Admin rejects request
 */
exports.rejectDonationRequest = async (req, res) => {
  try {
    const {
      adminNotes = ""
    } = req.body || {};

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
      donation: serializeDonation(donation)
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Failed to reject donation request",
      error: error?.message
    });
  }
};

/**
 * PATCH /api/donations/:id/progress
 * Admin manually records received support until payment flow exists
 */
exports.recordDonationProgress = async (req, res) => {
  try {
    const {
      amountReceived,
      donorIncrement
    } = req.body || {};

    const amount = Number(amountReceived);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        ok: false,
        message: "amountReceived must be a valid number greater than 0"
      });
    }

    const donorDelta = donorIncrement === undefined || donorIncrement === "" ? 1 : Number(donorIncrement);
    if (!Number.isInteger(donorDelta) || donorDelta < 0) {
      return res.status(400).json({
        ok: false,
        message: "donorIncrement must be a whole number 0 or greater"
      });
    }

    const donation = await DonationRequest.findById(req.params.id);
    if (!donation) {
      return res.status(404).json({ ok: false, message: "Donation request not found" });
    }

    if (donation.status !== "approved") {
      return res.status(400).json({
        ok: false,
        message: "Only approved donation requests can receive progress updates"
      });
    }

    if (donation.isClosed) {
      return res.status(400).json({
        ok: false,
        message: "Closed donation requests cannot receive progress updates"
      });
    }

    donation.raisedAmount = Number(donation.raisedAmount || 0) + amount;
    donation.donorCount = Number(donation.donorCount || 0) + donorDelta;
    await donation.save();

    return res.json({
      ok: true,
      message: "Donation progress updated",
      donation: serializeDonation(donation)
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Failed to update donation progress",
      error: error?.message
    });
  }
};

/**
 * PATCH /api/donations/:id/close
 * Requester or admin closes an approved request once help is complete
 */
exports.closeDonationRequest = async (req, res) => {
  try {
    const donation = await DonationRequest.findById(req.params.id);
    if (!donation) {
      return res.status(404).json({ ok: false, message: "Donation request not found" });
    }

    const userId = getAuthId(req);
    const ownsRequest = String(donation.createdBy || "") === userId;
    if (!ownsRequest && !isAdmin(req)) {
      return res.status(403).json({
        ok: false,
        message: "You do not have permission to close this donation request"
      });
    }

    if (donation.status !== "approved") {
      return res.status(400).json({
        ok: false,
        message: "Only approved donation requests can be closed"
      });
    }

    if (donation.isClosed) {
      return res.status(400).json({
        ok: false,
        message: "Donation request is already closed"
      });
    }

    donation.isClosed = true;
    donation.closedAt = new Date();
    await donation.save();

    return res.json({
      ok: true,
      message: "Donation request closed",
      donation: serializeDonation(donation)
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Failed to close donation request",
      error: error?.message
    });
  }
};
