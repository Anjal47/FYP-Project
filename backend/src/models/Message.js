const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },

    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    senderRole: {
      type: String,
      enum: ["user", "counsellor", "therapist"],
      required: true,
    },

    text: { type: String, required: true, trim: true },

    readByUser: { type: Boolean, default: false },
    readByStaff: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", MessageSchema);
