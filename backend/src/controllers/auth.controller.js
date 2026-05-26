const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendMail } = require("../utils/mailer");

const RESET_TOKEN_TTL_MINUTES = Number(process.env.RESET_TOKEN_TTL_MINUTES || 30);

function signToken(id, role) {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

function getBaseUrl(req) {
  return process.env.PUBLIC_BACKEND_URL || `${req.protocol}://${req.get("host")}`;
}

function serializeUser(user) {
  return {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    bio: user.bio || "",
    qualification: user.qualification || "",
    workingArea: user.workingArea || "",
    phone: user.phone || "",
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function sendAuthResponse(res, user, statusCode = 200) {
  return res.status(statusCode).json({
    ok: true,
    token: signToken(user._id.toString(), user.role),
    user: serializeUser(user),
  });
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function makeResetToken() {
  const plainToken = crypto.randomBytes(32).toString("hex");
  return {
    plainToken,
    tokenHash: crypto.createHash("sha256").update(plainToken).digest("hex"),
  };
}

function hashResetToken(token) {
  return crypto.createHash("sha256").update(String(token || "")).digest("hex");
}

function renderResetPasswordPage({ token, errorMessage = "", successMessage = "" }) {
  const errorBlock = errorMessage
    ? `<p style="color:#b42318;background:#fef3f2;border:1px solid #fecdca;padding:12px 14px;border-radius:12px;line-height:1.5;">${errorMessage}</p>`
    : "";
  const successBlock = successMessage
    ? `<p style="color:#067647;background:#ecfdf3;border:1px solid #abefc6;padding:12px 14px;border-radius:12px;line-height:1.5;">${successMessage}</p>`
    : "";

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Reset Password</title>
    <style>
      body { font-family: Arial, sans-serif; background:#f6f7fb; color:#111827; display:flex; align-items:center; justify-content:center; min-height:100vh; margin:0; padding:24px; }
      .card { width:100%; max-width:420px; background:#ffffff; border-radius:24px; box-shadow:0 14px 38px rgba(15,23,42,.08); padding:28px; }
      h1 { margin:0 0 10px; font-size:26px; }
      p { color:#4b5563; line-height:1.6; }
      label { display:block; margin-top:16px; margin-bottom:8px; font-weight:700; font-size:14px; }
      input { width:100%; border:1px solid #d0d5dd; border-radius:14px; padding:13px 14px; font-size:14px; box-sizing:border-box; }
      button { width:100%; margin-top:18px; border:none; background:#111827; color:#fff; border-radius:14px; padding:14px; font-size:14px; font-weight:700; cursor:pointer; }
      .hint { font-size:13px; color:#667085; margin-top:14px; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Reset your password</h1>
      <p>Choose a new password for your AngelTouch account.</p>
      ${errorBlock}
      ${successBlock}
      <form method="POST" action="/api/auth/reset-password">
        <input type="hidden" name="token" value="${token}" />
        <label for="password">New password</label>
        <input id="password" name="password" type="password" minlength="6" required />
        <label for="confirmPassword">Confirm new password</label>
        <input id="confirmPassword" name="confirmPassword" type="password" minlength="6" required />
        <button type="submit">Update password</button>
      </form>
      <p class="hint">For your security, this reset link will expire automatically.</p>
    </div>
  </body>
</html>`;
}

async function sendResetEmail({ req, user, plainToken }) {
  const resetUrl = `${getBaseUrl(req)}/api/auth/reset-password?token=${encodeURIComponent(plainToken)}`;

  await sendMail({
    to: user.email,
    subject: "Reset your AngelTouch password",
    text: `Hello ${user.fullName},\n\nUse the link below to reset your AngelTouch password:\n${resetUrl}\n\nThis link expires in ${RESET_TOKEN_TTL_MINUTES} minutes. If you did not request a password reset, you can ignore this email.`,
    html: `
      <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.6;max-width:560px;">
        <h2 style="margin-bottom:8px;">Reset your AngelTouch password</h2>
        <p>Hello ${user.fullName},</p>
        <p>We received a request to reset your password. Use the button below to choose a new one.</p>
        <p style="margin:24px 0;">
          <a href="${resetUrl}" style="background:#111827;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:12px;font-weight:700;display:inline-block;">Reset password</a>
        </p>
        <p>If the button does not open, copy and paste this link into your browser:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>This link expires in ${RESET_TOKEN_TTL_MINUTES} minutes. If you did not request this, you can ignore this email.</p>
      </div>
    `,
  });
}

exports.changeMyEmail = async (req, res, next) => {
  try {
    const u = req.user;
    const { newEmail, password } = req.body || {};

    if (!newEmail || !password) {
      return res.status(400).json({ ok: false, message: "newEmail and password required" });
    }

    const email = normalizeEmail(newEmail);
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) return res.status(400).json({ ok: false, message: "Invalid email format" });

    if (!u.passwordHash) {
      return res.status(400).json({ ok: false, message: "This account does not use password login yet" });
    }

    const passOk = await u.comparePassword(String(password));
    if (!passOk) return res.status(401).json({ ok: false, message: "Wrong password" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ ok: false, message: "Email already used" });

    u.email = email;
    await u.save();

    return res.json({
      ok: true,
      message: "Email updated",
      user: serializeUser(u),
    });
  } catch (e) {
    next(e);
  }
};

exports.registerUser = async (req, res, next) => {
  try {
    const { fullName, email, password } = req.body || {};

    if (!fullName || !email || !password) {
      return res.status(400).json({
        ok: false,
        message: "fullName, email, password required",
      });
    }

    const cleanEmail = normalizeEmail(email);
    const exists = await User.findOne({ email: cleanEmail });
    if (exists) {
      return res.status(409).json({ ok: false, message: "Email already used" });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const user = await User.create({
      fullName: fullName.trim(),
      email: cleanEmail,
      passwordHash,
      role: "user",
    });

    return sendAuthResponse(res, user, 201);
  } catch (e) {
    next(e);
  }
};

exports.login = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email || "");
    const password = String(req.body?.password || "");

    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        message: "email & password required",
      });
    }

    const user = await User.findOne({ email });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ ok: false, message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ ok: false, message: "Invalid credentials" });
    }

    if (user.isActive === false) {
      return res.status(403).json({ ok: false, message: "Account disabled" });
    }

    return sendAuthResponse(res, user);
  } catch (e) {
    next(e);
  }
};

exports.requestPasswordReset = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email || "");

    if (!email) {
      return res.status(400).json({ ok: false, message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (user) {
      const { plainToken, tokenHash } = makeResetToken();
      user.resetPasswordTokenHash = tokenHash;
      user.resetPasswordExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);
      await user.save();
      try {
        await sendResetEmail({ req, user, plainToken });
      } catch {
        return res.status(503).json({
          ok: false,
          message: "Password recovery is unavailable right now. Please try again later.",
        });
      }
    }

    return res.json({
      ok: true,
      message: "If an account exists for that email, a password reset link has been sent.",
    });
  } catch (e) {
    next(e);
  }
};

exports.renderResetPassword = async (req, res) => {
  const token = String(req.query?.token || "").trim();
  res.setHeader("Content-Type", "text/html; charset=utf-8");

  if (!token) {
    return res.status(400).send(renderResetPasswordPage({
      token: "",
      errorMessage: "This reset link is incomplete. Please request a new password reset email.",
    }));
  }

  return res.send(renderResetPasswordPage({ token }));
};

exports.resetPassword = async (req, res) => {
  try {
    const token = String(req.body?.token || req.query?.token || "").trim();
    const password = String(req.body?.password || "");
    const confirmPassword = String(req.body?.confirmPassword || "");

    res.setHeader("Content-Type", "text/html; charset=utf-8");

    if (!token) {
      return res.status(400).send(renderResetPasswordPage({
        token: "",
        errorMessage: "This reset link is incomplete. Please request a new one.",
      }));
    }

    if (!password || password.length < 6) {
      return res.status(400).send(renderResetPasswordPage({
        token,
        errorMessage: "Your new password must be at least 6 characters long.",
      }));
    }

    if (password !== confirmPassword) {
      return res.status(400).send(renderResetPasswordPage({
        token,
        errorMessage: "Password confirmation does not match.",
      }));
    }

    const user = await User.findOne({
      resetPasswordTokenHash: hashResetToken(token),
      resetPasswordExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).send(renderResetPasswordPage({
        token: "",
        errorMessage: "This reset link is invalid or has expired. Please request a new one.",
      }));
    }

    user.passwordHash = await bcrypt.hash(password, 10);
    user.resetPasswordTokenHash = "";
    user.resetPasswordExpiresAt = null;
    await user.save();

    return res.send(renderResetPasswordPage({
      token: "",
      successMessage: "Your password has been updated successfully. You can close this page and log in to AngelTouch.",
    }));
  } catch (e) {
    return res.status(500).send(renderResetPasswordPage({
      token: String(req.body?.token || req.query?.token || ""),
      errorMessage: e.message || "Unable to reset password right now.",
    }));
  }
};

exports.me = async (req, res, next) => {
  try {
    return res.json({
      ok: true,
      user: serializeUser(req.user),
    });
  } catch (e) {
    next(e);
  }
};

exports.updateMe = async (req, res, next) => {
  try {
    const u = req.user;
    const { fullName, phone, bio, qualification, workingArea } = req.body || {};

    const updates = {};
    if (typeof fullName === "string") updates.fullName = fullName.trim();
    if (typeof phone === "string") updates.phone = phone.trim();

    const isStaff = ["counsellor", "therapist", "police", "municipality"].includes(u.role);
    if (isStaff) {
      if (typeof bio === "string") updates.bio = bio.trim();
      if (typeof qualification === "string") updates.qualification = qualification.trim();
      if (typeof workingArea === "string") updates.workingArea = workingArea.trim();
    }

    if (updates.fullName && updates.fullName.length < 2) {
      return res.status(400).json({ ok: false, message: "fullName too short" });
    }

    const saved = await User.findByIdAndUpdate(u._id, { $set: updates }, { new: true });

    return res.json({
      ok: true,
      message: "Profile updated",
      user: serializeUser(saved),
    });
  } catch (e) {
    next(e);
  }
};

exports.changeMyPassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ ok: false, message: "currentPassword and newPassword required" });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({ ok: false, message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ ok: false, message: "User not found" });
    }

    if (!user.passwordHash) {
      return res.status(400).json({ ok: false, message: "Use password reset to create a password for this account" });
    }

    const match = await bcrypt.compare(String(currentPassword), user.passwordHash);
    if (!match) {
      return res.status(401).json({ ok: false, message: "Wrong current password" });
    }

    user.passwordHash = await bcrypt.hash(String(newPassword), 10);
    await user.save();

    return res.json({ ok: true, message: "Password updated successfully" });
  } catch (e) {
    next(e);
  }
};
