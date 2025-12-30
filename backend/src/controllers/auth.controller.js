const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
}

// ✅ Public register: ONLY normal users
exports.registerUser = async (req, res, next) => {
  try {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) {
      return res.status(400).json({ ok: false, message: "fullName, email, password required" });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ ok: false, message: "Email already used" });

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({ fullName, email, passwordHash, role: "user" });
    const token = signToken(user._id.toString());

    return res.status(201).json({
      ok: true,
      token,
      user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role },
    });
  } catch (e) {
    next(e);
  }
};

// ✅ Login: all roles
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ ok: false, message: "email & password required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ ok: false, message: "Invalid credentials" });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ ok: false, message: "Invalid credentials" });

    const token = signToken(user._id.toString());
    return res.json({
      ok: true,
      token,
      user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role },
    });
  } catch (e) {
    next(e);
  }
};
// ✅ Get current logged-in user profile
exports.me = async (req, res, next) => {
  try {
    // req.user is set by auth middleware
    const user = req.user;

    return res.json({
      ok: true,
      user: {
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
      },
    });
  } catch (e) {
    next(e);
  }
};

exports.updateMe = async (req, res, next) => {
  try {
    const u = req.user;

    const {
      fullName,
      phone,
      bio,
      qualification,
      workingArea,
    } = req.body || {};

    // Base fields everyone can update
    const updates = {};

    if (typeof fullName === "string") updates.fullName = fullName.trim();
    if (typeof phone === "string") updates.phone = phone.trim();

    // Staff-only fields
    const isStaff = ["counsellor", "therapist", "police"].includes(u.role);

    if (isStaff) {
      if (typeof bio === "string") updates.bio = bio.trim();
      if (typeof qualification === "string") updates.qualification = qualification.trim();
      if (typeof workingArea === "string") updates.workingArea = workingArea.trim();
    }

    // Simple validation
    if (updates.fullName && updates.fullName.length < 2) {
      return res.status(400).json({ ok: false, message: "fullName too short" });
    }
    if (updates.phone && updates.phone.length > 30) {
      return res.status(400).json({ ok: false, message: "phone too long" });
    }

    const saved = await User.findByIdAndUpdate(
      u._id,
      { $set: updates },
      { new: true }
    );

    return res.json({
      ok: true,
      message: "Profile updated",
      user: {
        id: saved._id,
        fullName: saved.fullName,
        email: saved.email,
        role: saved.role,

        bio: saved.bio || "",
        qualification: saved.qualification || "",
        workingArea: saved.workingArea || "",
        phone: saved.phone || "",

        isActive: saved.isActive,
        createdAt: saved.createdAt,
        updatedAt: saved.updatedAt,
      },
    });
  } catch (e) {
    next(e);
  }
};

/**
 * ✅ PATCH /api/auth/me/email
 * Requires current password to confirm identity.
 * Body: { newEmail, password }
 */
exports.changeMyEmail = async (req, res, next) => {
  try {
    const u = req.user;
    const { newEmail, password } = req.body || {};

    if (!newEmail || !password) {
      return res.status(400).json({ ok: false, message: "newEmail and password required" });
    }

    const email = String(newEmail).trim().toLowerCase();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) return res.status(400).json({ ok: false, message: "Invalid email format" });

    const passOk = await u.comparePassword(String(password));
    if (!passOk) return res.status(401).json({ ok: false, message: "Wrong password" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ ok: false, message: "Email already used" });

    u.email = email;
    await u.save();

    return res.json({
      ok: true,
      message: "Email updated",
      user: { id: u._id, fullName: u.fullName, email: u.email, role: u.role },
    });
  } catch (e) {
    next(e);
  }
};

/**
 * ✅ PATCH /api/auth/me/password
 * Requires current password to change password.
 * Body: { currentPassword, newPassword }
 */
exports.changeMyPassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ ok: false, message: "currentPassword and newPassword required" });
    }

    if (String(newPassword).trim().length < 6) {
      return res.status(400).json({ ok: false, message: "New password must be at least 6 characters" });
    }

    // ✅ fetch fresh user to guarantee passwordHash exists
    const user = await User.findById(req.user._id);
    if (!user) return res.status(401).json({ ok: false, message: "User not found" });
    if (!user.passwordHash) return res.status(500).json({ ok: false, message: "passwordHash missing for user" });

    const match = await bcrypt.compare(String(currentPassword), user.passwordHash);
    if (!match) return res.status(401).json({ ok: false, message: "Wrong current password" });

    user.passwordHash = await bcrypt.hash(String(newPassword).trim(), 10);
    await user.save();

    return res.json({ ok: true, message: "Password updated successfully" });
  } catch (e) {
    next(e);
  }
};

