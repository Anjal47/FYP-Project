const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const requireRole = require("../middleware/role");

const donationUpload = require("../middleware/donationUpload");

const ctrl = require("../controllers/donation.controller");

/**
 * =========================
 * USER ROUTES
 * =========================
 */

// Create donation request (with QR + proof upload)
router.post(
  "/",
  auth,
  donationUpload,
  ctrl.createDonationRequest
);

// Get all approved donations (for users)
router.get(
  "/approved",
  auth,
  ctrl.getApprovedDonations
);

router.get(
  "/mine",
  auth,
  ctrl.getMyDonationRequests
);

router.patch(
  "/:id/close",
  auth,
  ctrl.closeDonationRequest
);

/**
 * =========================
 * ADMIN ROUTES
 * =========================
 */

// Get pending donations
router.get(
  "/pending",
  auth,
  requireRole("admin"),
  ctrl.getPendingDonations
);

router.get(
  "/manage",
  auth,
  requireRole("admin"),
  ctrl.getAdminDonations
);

// Approve donation
router.patch(
  "/:id/approve",
  auth,
  requireRole("admin"),
  ctrl.approveDonationRequest
);

// Reject donation
router.patch(
  "/:id/reject",
  auth,
  requireRole("admin"),
  ctrl.rejectDonationRequest
);

router.patch(
  "/:id/progress",
  auth,
  requireRole("admin"),
  ctrl.recordDonationProgress
);

module.exports = router;
