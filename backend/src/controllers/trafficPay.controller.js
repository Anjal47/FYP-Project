const TrafficFine = require("../models/TrafficFine");
const TrafficPayment = require("../models/TrafficPayment");

exports.createFine = async (req, res) => {
  try {
    const { user, fineCode, reason, amount, status = "UNPAID" } = req.body || {};

    if (!user || !fineCode || !reason || !amount) {
      return res.status(400).json({
        ok: false,
        message: "user, fineCode, reason and amount are required",
      });
    }

    const fine = await TrafficFine.create({
      user,
      fineCode,
      reason,
      amount,
      status,
    });

    return res.status(201).json({
      ok: true,
      fine,
    });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      message: e.message,
    });
  }
};

exports.getMyFines = async (req, res) => {
  try {
    const fines = await TrafficFine.find({ user: req.user?._id }).sort({
      createdAt: -1,
    });

    return res.json({
      ok: true,
      fines,
    });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      message: e.message,
    });
  }
};

exports.initiatePayment = async (req, res) => {
  try {
    const { fineId } = req.body || {};

    if (!fineId) {
      return res.status(400).json({
        ok: false,
        message: "fineId is required",
      });
    }

    const fine = await TrafficFine.findById(fineId);

    if (!fine) {
      return res.status(404).json({
        ok: false,
        message: "Fine not found",
      });
    }

    const payment = await TrafficPayment.create({
      fine: fine._id,
      amount: fine.amount,
      transactionRef: "TXN-" + Date.now(),
      status: "PENDING",
      method: "MOCK",
    });

    await TrafficFine.findByIdAndUpdate(fine._id, { status: "PENDING" });

    return res.json({
      ok: true,
      payment,
    });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      message: e.message,
    });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { paymentId } = req.body || {};

    if (!paymentId) {
      return res.status(400).json({
        ok: false,
        message: "paymentId is required",
      });
    }

    const payment = await TrafficPayment.findById(paymentId).populate("fine");

    if (!payment) {
      return res.status(404).json({
        ok: false,
        message: "Payment not found",
      });
    }

    payment.status = "SUCCESS";
    await payment.save();

    if (payment.fine?._id) {
      await TrafficFine.findByIdAndUpdate(payment.fine._id, { status: "PAID" });
    }

    return res.json({
      ok: true,
      message: "Payment verified successfully",
      payment,
    });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      message: e.message,
    });
  }
};