const crypto = require("crypto");
const TrafficFine = require("../models/TrafficFine");
const TrafficPayment = require("../models/TrafficPayment");
const User = require("../models/User");

const ESEWA_PRODUCT_CODE = process.env.ESEWA_PRODUCT_CODE || "EPAYTEST";
const ESEWA_SECRET_KEY = process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q";
const ESEWA_FORM_URL =
  process.env.ESEWA_FORM_URL || "https://rc-epay.esewa.com.np/api/epay/main/v2/form";
const ESEWA_STATUS_URL =
  process.env.ESEWA_STATUS_URL ||
  "https://rc.esewa.com.np/api/epay/transaction/status/";

function getBaseUrl(req) {
  return process.env.PUBLIC_BACKEND_URL || `${req.protocol}://${req.get("host")}`;
}

function createTransactionUuid(fineId) {
  return `fine-${fineId}-${Date.now()}`;
}

function createFineCode() {
  const year = new Date().getFullYear();
  const suffix = String(Date.now()).slice(-6);
  return `FINE-${year}-${suffix}`;
}

function createEsewaSignature({ totalAmount, transactionUuid, productCode }) {
  const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
  return crypto.createHmac("sha256", ESEWA_SECRET_KEY).update(message).digest("base64");
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function decodeEsewaData(encoded) {
  if (!encoded) return null;
  try {
    const raw = Buffer.from(String(encoded), "base64").toString("utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function syncPaymentFromEsewaStatus(payment) {
  const url = new URL(ESEWA_STATUS_URL);
  url.searchParams.set("product_code", ESEWA_PRODUCT_CODE);
  url.searchParams.set("total_amount", String(payment.amount));
  url.searchParams.set("transaction_uuid", payment.transactionRef);

  const response = await fetch(url);
  const rawText = await response.text();

  let data = {};
  try {
    data = JSON.parse(rawText);
  } catch {
    throw new Error("Invalid response from eSewa status API");
  }

  payment.gatewayStatus = String(data?.status || "");
  payment.gatewayRef = String(data?.ref_id || "");
  payment.gatewayPayload = JSON.stringify(data);

  if (data?.status === "COMPLETE") {
    payment.status = "SUCCESS";
    await payment.save();
    await TrafficFine.findByIdAndUpdate(payment.fine, { status: "PAID" });
  } else if (["CANCELED", "NOT_FOUND", "FULL_REFUND", "PARTIAL_REFUND", "AMBIGUOUS"].includes(String(data?.status))) {
    payment.status = "FAILED";
    await payment.save();
    await TrafficFine.findByIdAndUpdate(payment.fine, { status: "UNPAID" });
  } else {
    payment.status = "PENDING";
    await payment.save();
    await TrafficFine.findByIdAndUpdate(payment.fine, { status: "PENDING" });
  }

  return data;
}

exports.createFine = async (req, res) => {
  try {
    const { user, userEmail, fineCode, reason, amount, status = "UNPAID" } = req.body || {};

    if ((!user && !userEmail) || !reason || !amount) {
      return res.status(400).json({
        ok: false,
        message: "user or userEmail, reason and amount are required",
      });
    }

    let targetUserId = user;
    let targetUser = null;

    if (userEmail) {
      const normalizedEmail = String(userEmail).trim().toLowerCase();
      targetUser = await User.findOne({ email: normalizedEmail }).select("_id email fullName role");

      if (!targetUser || targetUser.role !== "user") {
        return res.status(404).json({
          ok: false,
          message: "User with that email was not found",
        });
      }

      targetUserId = targetUser._id;
    }

    if (!targetUserId) {
      return res.status(400).json({
        ok: false,
        message: "Target user is required",
      });
    }

    const fine = await TrafficFine.create({
      user: targetUserId,
      fineCode: fineCode || createFineCode(),
      reason,
      amount,
      status,
      issuedBy: req.user?._id || null,
    });

    return res.status(201).json({
      ok: true,
      fine,
      user: targetUser
        ? {
            _id: targetUser._id,
            email: targetUser.email,
            fullName: targetUser.fullName,
          }
        : undefined,
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

    if (String(fine.user) !== String(req.user?._id)) {
      return res.status(403).json({
        ok: false,
        message: "You can only pay your own fine",
      });
    }

    const transactionRef = createTransactionUuid(fine._id);
    const totalAmount = String(fine.amount);
    const payment = await TrafficPayment.create({
      fine: fine._id,
      amount: fine.amount,
      transactionRef,
      status: "PENDING",
      method: "ESEWA",
    });

    await TrafficFine.findByIdAndUpdate(fine._id, { status: "PENDING" });

    const baseUrl = getBaseUrl(req);
    const formFields = {
      amount: totalAmount,
      tax_amount: "0",
      total_amount: totalAmount,
      transaction_uuid: transactionRef,
      product_code: ESEWA_PRODUCT_CODE,
      product_service_charge: "0",
      product_delivery_charge: "0",
      success_url: `${baseUrl}/api/traffic/payments/esewa/success?paymentId=${payment._id}`,
      failure_url: `${baseUrl}/api/traffic/payments/esewa/failure?paymentId=${payment._id}`,
      signed_field_names: "total_amount,transaction_uuid,product_code",
    };
    formFields.signature = createEsewaSignature({
      totalAmount: formFields.total_amount,
      transactionUuid: formFields.transaction_uuid,
      productCode: formFields.product_code,
    });

    return res.json({
      ok: true,
      payment,
      esewa: {
        formUrl: ESEWA_FORM_URL,
        redirectUrl: `${baseUrl}/api/traffic/payments/${payment._id}/esewa`,
        formFields,
      },
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

    if (String(payment.fine?.user) !== String(req.user?._id)) {
      return res.status(403).json({
        ok: false,
        message: "You can only verify your own fine payment",
      });
    }

    const verification = await syncPaymentFromEsewaStatus(payment);

    return res.json({
      ok: true,
      message:
        payment.status === "SUCCESS"
          ? "Payment verified successfully"
          : `Payment status: ${verification?.status || payment.status}`,
      payment,
      verification,
    });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      message: e.message,
    });
  }
};

exports.renderEsewaForm = async (req, res) => {
  try {
    const payment = await TrafficPayment.findById(req.params.paymentId).populate("fine");
    if (!payment) {
      return res.status(404).send("<h1>Payment not found</h1>");
    }

    const totalAmount = String(payment.amount);
    const formFields = {
      amount: totalAmount,
      tax_amount: "0",
      total_amount: totalAmount,
      transaction_uuid: payment.transactionRef,
      product_code: ESEWA_PRODUCT_CODE,
      product_service_charge: "0",
      product_delivery_charge: "0",
      success_url: `${getBaseUrl(req)}/api/traffic/payments/esewa/success?paymentId=${payment._id}`,
      failure_url: `${getBaseUrl(req)}/api/traffic/payments/esewa/failure?paymentId=${payment._id}`,
      signed_field_names: "total_amount,transaction_uuid,product_code",
    };
    formFields.signature = createEsewaSignature({
      totalAmount: formFields.total_amount,
      transactionUuid: formFields.transaction_uuid,
      productCode: formFields.product_code,
    });

    const inputs = Object.entries(formFields)
      .map(
        ([key, value]) =>
          `<input type="hidden" name="${escapeHtml(key)}" value="${escapeHtml(value)}" />`
      )
      .join("");

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.send(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Redirecting to eSewa</title>
    <style>
      body { font-family: Arial, sans-serif; background:#f6f7fb; color:#222; display:flex; align-items:center; justify-content:center; min-height:100vh; margin:0; padding:24px; }
      .card { background:#fff; border-radius:18px; box-shadow:0 10px 30px rgba(0,0,0,.08); max-width:420px; width:100%; padding:24px; text-align:center; }
      .btn { display:inline-block; margin-top:16px; background:#60bb46; color:#fff; border:none; border-radius:12px; padding:12px 18px; font-weight:700; cursor:pointer; -webkit-appearance:none; appearance:none; }
      .muted { color:#666; font-size:14px; line-height:1.5; }
      .tap { display:block; text-decoration:none; }
    </style>
  </head>
  <body>
    <div class="card">
      <h2>Redirecting to eSewa</h2>
      <p class="muted">Your sandbox fine payment is being prepared. If the page does not continue automatically, tap the button below.</p>
      <form id="esewa-form" action="${escapeHtml(ESEWA_FORM_URL)}" method="POST">
        ${inputs}
        <button id="esewa-btn" class="btn" type="button">Continue to eSewa</button>
      </form>
      <noscript>
        <p class="muted">JavaScript is disabled. Tap the button above to continue.</p>
      </noscript>
    </div>
    <script>
      (function () {
        var form = document.getElementById('esewa-form');
        var button = document.getElementById('esewa-btn');
        var submitted = false;

        function submitEsewa() {
          if (!form || submitted) return false;
          submitted = true;
          try {
            HTMLFormElement.prototype.submit.call(form);
          } catch (error) {
            submitted = false;
          }
          return false;
        }

        function trySubmit() {
          if (!form || submitted) return;
          submitEsewa();
        }

        if (button) {
          button.addEventListener('click', submitEsewa);
          button.addEventListener('touchend', function (event) {
            event.preventDefault();
            submitEsewa();
          });
        }

        document.body.addEventListener('touchend', function () {
          if (!submitted) submitEsewa();
        }, { passive: true });

        if (document.readyState === 'complete' || document.readyState === 'interactive') {
          setTimeout(trySubmit, 150);
        } else {
          document.addEventListener('DOMContentLoaded', function () {
            setTimeout(trySubmit, 150);
          });
        }

        setTimeout(trySubmit, 900);
      })();
    </script>
  </body>
</html>`);
  } catch (e) {
    return res.status(500).send(`<h1>Payment setup failed</h1><p>${escapeHtml(e.message)}</p>`);
  }
};

exports.handleEsewaSuccess = async (req, res) => {
  try {
    const payment = await TrafficPayment.findById(req.query.paymentId);
    if (!payment) {
      return res.status(404).send("<h1>Payment not found</h1>");
    }

    const decoded = decodeEsewaData(req.query.data);
    if (decoded) {
      payment.gatewayStatus = String(decoded.status || "");
      payment.gatewayRef = String(decoded.transaction_code || "");
      payment.gatewayPayload = JSON.stringify(decoded);
      await payment.save();
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.send(`<!doctype html>
<html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Payment Received</title></head>
<body style="font-family:Arial,sans-serif;background:#f6f7fb;padding:24px;">
  <div style="max-width:420px;margin:40px auto;background:#fff;border-radius:18px;padding:24px;box-shadow:0 10px 30px rgba(0,0,0,.08);">
    <h2 style="margin-top:0;">Payment Response Received</h2>
    <p style="color:#555;line-height:1.5;">eSewa returned a success response. Please go back to the app and tap <strong>Verify Payment</strong> to confirm the transaction status.</p>
  </div>
</body></html>`);
  } catch (e) {
    return res.status(500).send(`<h1>Payment callback failed</h1><p>${escapeHtml(e.message)}</p>`);
  }
};

exports.handleEsewaFailure = async (req, res) => {
  try {
    const payment = await TrafficPayment.findById(req.query.paymentId);
    if (payment) {
      payment.gatewayStatus = "FAILED_OR_CANCELED";
      payment.status = "FAILED";
      await payment.save();
      await TrafficFine.findByIdAndUpdate(payment.fine, { status: "UNPAID" });
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.send(`<!doctype html>
<html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Payment Not Completed</title></head>
<body style="font-family:Arial,sans-serif;background:#f6f7fb;padding:24px;">
  <div style="max-width:420px;margin:40px auto;background:#fff;border-radius:18px;padding:24px;box-shadow:0 10px 30px rgba(0,0,0,.08);">
    <h2 style="margin-top:0;">Payment Not Completed</h2>
    <p style="color:#555;line-height:1.5;">The eSewa payment was canceled or not completed. You can return to the app and try again.</p>
  </div>
</body></html>`);
  } catch (e) {
    return res.status(500).send(`<h1>Payment callback failed</h1><p>${escapeHtml(e.message)}</p>`);
  }
};
