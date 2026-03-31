const mongoose = require("mongoose");

const ConversationSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
      index: true,
    },

    serviceType: {
      type: String,
      enum: ["counseling", "therapy"],
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ✅ staff can be counsellor OR therapist (same field)
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // just for UI / debugging (controller stays same)
    staffRole: {
      type: String,
      enum: ["counsellor", "therapist"],
      required: true,
    },

    lastMessageAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Conversation", ConversationSchema);
