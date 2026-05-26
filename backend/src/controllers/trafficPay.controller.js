const Stripe = require("stripe");
const TrafficFine = require("../models/TrafficFine");
const TrafficPayment = require("../models/TrafficPayment");
const User = require("../models/User");

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_CURRENCY = String(process.env.STRIPE_CURRENCY || "usd").toLowerCase();
const APP_DEEP_LINK_SCHEME = process.env.APP_DEEP_LINK_SCHEME || "angeltouch";

let stripeClient = null;

function getStripeClient() {
  if (!STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured on the backend");
  }

  if (STRIPE_SECRET_KEY.includes("replace_with_your_key")) {
    throw new Error("STRIPE_SECRET_KEY is still using the placeholder value in backend/.env");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(STRIPE_SECRET_KEY);
  }

  return stripeClient;
}

function getBaseUrl(req) {
  return process.env.PUBLIC_BACKEND_URL || `${req.protocol}://${req.get("host")}`;
}

function getAppReturnUrl(paymentId, status) {
  const url = new URL(`${APP_DEEP_LINK_SCHEME}://payment-return`);
  if (paymentId) {
    url.searchParams.set("paymentId", String(paymentId));
  }
  if (status) {
    url.searchParams.set("status", String(status));
  }
  return url.toString();
}

function createTransactionRef(fineId) {
  return `fine-${fineId}-${Date.now()}`;
}

function createFineCode() {
  const year = new Date().getFullYear();
  const suffix = String(Date.now()).slice(-6);
  return `FINE-${year}-${suffix}`;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderReturnPage({ title, heading, message, paymentId, status, buttonLabel }) {
  const appUrl = getAppReturnUrl(paymentId, status);

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      body { font-family: Arial, sans-serif; background:#f6f7fb; color:#222; display:flex; align-items:center; justify-content:center; min-height:100vh; margin:0; padding:24px; }
      .card { background:#fff; border-radius:18px; box-shadow:0 10px 30px rgba(0,0,0,.08); max-width:440px; width:100%; padding:24px; text-align:center; }
      .btn { display:inline-block; margin-top:18px; background:#111827; color:#fff; text-decoration:none; border:none; border-radius:12px; padding:13px 18px; font-weight:700; }
      .muted { color:#666; font-size:14px; line-height:1.6; }
      .hint { margin-top:14px; color:#8a8f98; font-size:13px; }
    </style>
  </head>
  <body>
    <div class="card">
      <h2 style="margin-top:0;">${escapeHtml(heading)}</h2>
      <p class="muted">${message}</p>
      <a class="btn" href="${escapeHtml(appUrl)}">${escapeHtml(buttonLabel || "Return to AngelTouch")}</a>
      <p class="hint">If the app does not open automatically, tap the button above.</p>
    </div>
    <script>
      (function () {
        var appUrl = ${JSON.stringify(appUrl)};
        setTimeout(function () {
          window.location.href = appUrl;
        }, 500);
      })();
    </script>
  </body>
</html>`;
}

function toStripeAmount(amount) {
  const parsed = Number(amount);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("Fine amount must be a valid positive number");
  }

  return Math.round(parsed * 100);
}

async function setPaymentState(payment, status, gatewayStatus, gatewayPayload) {
  payment.status = status;
  payment.gatewayStatus = gatewayStatus;
  payment.gatewayPayload = JSON.stringify(gatewayPayload || {});
  await payment.save();

  await TrafficFine.findByIdAndUpdate(payment.fine, {
    status: status === "SUCCESS" ? "PAID" : status === "FAILED" ? "UNPAID" : "PENDING",
  });
}

async function syncPaymentFromStripe(payment) {
  if (!payment.gatewayRef) {
    throw new Error("Stripe checkout session reference is missing for this payment");
  }

  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.retrieve(payment.gatewayRef, {
    expand: ["payment_intent"],
  });

  const paymentStatus = String(session.payment_status || "").toLowerCase();
  const sessionStatus = String(session.status || "").toLowerCase();
  const intentId = session.payment_intent && typeof session.payment_intent === "object"
    ? session.payment_intent.id
    : session.payment_intent;

  payment.gatewayRef = String(session.id || payment.gatewayRef);
  if (intentId) {
    payment.transactionRef = String(intentId);
  }

  if (paymentStatus === "paid") {
    await setPaymentState(payment, "SUCCESS", sessionStatus || paymentStatus, session);
  } else if (sessionStatus === "expired" || sessionStatus === "complete" || paymentStatus === "unpaid") {
    await setPaymentState(payment, "FAILED", sessionStatus || paymentStatus, session);
  } else {
    await setPaymentState(payment, "PENDING", sessionStatus || paymentStatus, session);
  }

  return session;
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

    if (fine.status === "PAID") {
      return res.status(409).json({
        ok: false,
        message: "This fine has already been paid",
      });
    }

    const existingPendingPayment = await TrafficPayment.findOne({
      fine: fine._id,
      status: "PENDING",
      method: "STRIPE",
    }).sort({ createdAt: -1 });

    if (existingPendingPayment) {
      return res.status(409).json({
        ok: false,
        message: "A payment for this fine is already in progress. Return to the app and tap Verify Payment before trying again.",
        payment: existingPendingPayment,
      });
    }

    const baseUrl = getBaseUrl(req);
    const localRef = createTransactionRef(fine._id);

    const payment = await TrafficPayment.create({
      fine: fine._id,
      amount: fine.amount,
      transactionRef: localRef,
      status: "PENDING",
      method: "STRIPE",
    });

    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      client_reference_id: String(payment._id),
      customer_email: req.user?.email || undefined,
      success_url: `${baseUrl}/api/traffic/payments/stripe/success?paymentId=${payment._id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/api/traffic/payments/stripe/cancel?paymentId=${payment._id}&session_id={CHECKOUT_SESSION_ID}`,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: STRIPE_CURRENCY,
            product_data: {
              name: `Traffic Fine ${fine.fineCode || ""}`.trim(),
              description: fine.reason,
            },
            unit_amount: toStripeAmount(fine.amount),
          },
        },
      ],
      metadata: {
        paymentId: String(payment._id),
        fineId: String(fine._id),
        fineCode: String(fine.fineCode || ""),
        localRef,
      },
    });

    const checkoutUrl =
      session.url ||
      session?.next_action?.redirect_to_url?.url ||
      "";

    if (!checkoutUrl) {
      throw new Error(
        `Stripe Checkout session was created without a redirect URL${session?.id ? ` (session ${session.id})` : ""}`
      );
    }

    payment.gatewayRef = String(session.id || "");
    payment.gatewayStatus = String(session.status || "open");
    payment.gatewayPayload = JSON.stringify(session);
    await payment.save();

    await TrafficFine.findByIdAndUpdate(fine._id, { status: "PENDING" });

    return res.json({
      ok: true,
      payment,
      stripe: {
        checkoutUrl,
        sessionId: session.id,
        currency: STRIPE_CURRENCY,
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

    const verification = await syncPaymentFromStripe(payment);

    return res.json({
      ok: true,
      message:
        payment.status === "SUCCESS"
          ? "Payment verified successfully"
          : `Payment status: ${verification?.payment_status || verification?.status || payment.status}`,
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

exports.handleStripeSuccess = async (req, res) => {
  try {
    const payment = await TrafficPayment.findById(req.query.paymentId);
    if (!payment) {
      return res.status(404).send("<h1>Payment not found</h1>");
    }

    if (req.query.session_id) {
      payment.gatewayRef = String(req.query.session_id);
      await payment.save();
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.send(
      renderReturnPage({
        title: "Payment Received",
        heading: "Stripe Payment Received",
        message:
          "Stripe has returned you to the app flow. We will try to reopen AngelTouch for you now so you can confirm the payment.",
        paymentId: payment._id,
        status: "success",
        buttonLabel: "Back to AngelTouch",
      })
    );
  } catch (e) {
    return res.status(500).send(`<h1>Payment callback failed</h1><p>${escapeHtml(e.message)}</p>`);
  }
};

exports.handleStripeCancel = async (req, res) => {
  try {
    const payment = await TrafficPayment.findById(req.query.paymentId);
    if (payment) {
      if (req.query.session_id) {
        payment.gatewayRef = String(req.query.session_id);
      }
      payment.gatewayStatus = "canceled";
      payment.gatewayPayload = JSON.stringify({ session_id: req.query.session_id || "" });
      payment.status = "FAILED";
      await payment.save();
      await TrafficFine.findByIdAndUpdate(payment.fine, { status: "UNPAID" });
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.send(
      renderReturnPage({
        title: "Payment Not Completed",
        heading: "Payment Not Completed",
        message:
          "The Stripe checkout session was canceled or not completed. We will try to reopen AngelTouch for you now.",
        paymentId: payment?._id || req.query.paymentId,
        status: "cancel",
        buttonLabel: "Return to AngelTouch",
      })
    );
  } catch (e) {
    return res.status(500).send(`<h1>Payment callback failed</h1><p>${escapeHtml(e.message)}</p>`);
  }
};
