const mongoose = require("mongoose");

const CounselingReviewSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CounselingAppointment",
      required: true,
    },
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    revieweeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reviewerRole: {
      type: String,
      enum: ["user", "counsellor"],
      required: true,
    },
    revieweeRole: {
      type: String,
      enum: ["user", "counsellor"],
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
  },
  { timestamps: true }
);

CounselingReviewSchema.index(
  { appointmentId: 1, reviewerId: 1 },
  { unique: true, name: "uniq_counseling_review_per_appointment_per_reviewer" }
);

CounselingReviewSchema.index({ revieweeId: 1, createdAt: -1 });

module.exports = mongoose.model("CounselingReview", CounselingReviewSchema);
