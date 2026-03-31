const mongoose = require("mongoose");

const DonationRequestSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    contact: {
      type: String,
      required: true,
      trim: true,
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },

    helpType: {
      type: String,
      required: true,
      trim: true,
      default: "Medical",
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    amountNeeded: {
      type: Number,
      required: true,
      min: 1,
    },

    urgency: {
      type: String,
      enum: ["Low", "Medium", "Urgent"],
      default: "Medium",
    },

    qrImage: {
      type: String,
      default: "",
    },

    proofImage: {
      type: String,
      default: "",
    },

    proofVideo: {
      type: String,
      default: "",
    },

    adminNotes: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DonationRequest", DonationRequestSchema);