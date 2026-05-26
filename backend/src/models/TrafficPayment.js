const mongoose = require("mongoose");

const TrafficPaymentSchema = new mongoose.Schema(
  {
    fine: { type: mongoose.Schema.Types.ObjectId, ref: "TrafficFine", required: true },

    amount: { type: Number, required: true },

    method: {
      type: String,
      enum: ["STRIPE", "MOCK"],
      default: "MOCK",
    },

    transactionRef: { type: String, required: true },
    gatewayRef: { type: String, default: "" },
    gatewayStatus: { type: String, default: "" },
    gatewayPayload: { type: String, default: "" },

    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "PENDING",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TrafficPayment", TrafficPaymentSchema);
