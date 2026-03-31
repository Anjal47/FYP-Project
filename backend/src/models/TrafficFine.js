const mongoose = require("mongoose");

const TrafficFineSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    fineCode: { type: String, required: true, unique: true },

    reason: { type: String, required: true },
    amount: { type: Number, required: true },

    status: {
      type: String,
      enum: ["UNPAID", "PENDING", "PAID"],
      default: "UNPAID",
      index: true,
    },

    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // police

  },
  { timestamps: true }
);

module.exports = mongoose.model("TrafficFine", TrafficFineSchema);