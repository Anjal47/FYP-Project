const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

/* ================= TOKEN ================= */
function signToken(id, role) {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}
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

/* ================= REGISTER (PUBLIC USER ONLY) ================= */
exports.registerUser = async (req, res, next) => {
  try {
    const { fullName, email, password } = req.body || {};

    if (!fullName || !email || !password) {
      return res.status(400).json({
        ok: false,
        message: "fullName, email, password required",
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();

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

    const token = signToken(user._id.toString(), user.role);

    return res.status(201).json({
      ok: true,
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (e) {
    next(e);
  }
};

/* ================= LOGIN (ALL ROLES) ================= */
exports.login = async (req, res, next) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
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
      return res.status(403).json({
        ok: false,
        message: "Account disabled",
      });
    }

    const token = signToken(user._id.toString(), user.role);

    return res.json({
      ok: true,
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (e) {
    next(e);
  }
};

/* ================= GET CURRENT USER ================= */
exports.me = async (req, res, next) => {
  try {
    const u = req.user;

    return res.json({
      ok: true,
      user: {
        id: u._id,
        fullName: u.fullName,
        email: u.email,
        role: u.role,
        bio: u.bio || "",
        qualification: u.qualification || "",
        workingArea: u.workingArea || "",
        phone: u.phone || "",
        isActive: u.isActive,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      },
    });
  } catch (e) {
    next(e);
  }
};

/* ================= UPDATE PROFILE ================= */
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

    const updates = {};

    if (typeof fullName === "string") updates.fullName = fullName.trim();
    if (typeof phone === "string") updates.phone = phone.trim();

    // ✅ Staff includes municipality
    const isStaff = ["counsellor", "therapist", "police", "municipality"].includes(u.role);

    if (isStaff) {
      if (typeof bio === "string") updates.bio = bio.trim();
      if (typeof qualification === "string") updates.qualification = qualification.trim();
      if (typeof workingArea === "string") updates.workingArea = workingArea.trim();
    }

    if (updates.fullName && updates.fullName.length < 2) {
      return res.status(400).json({ ok: false, message: "fullName too short" });
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

/* ================= CHANGE PASSWORD ================= */
exports.changeMyPassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        ok: false,
        message: "currentPassword and newPassword required",
      });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({
        ok: false,
        message: "New password must be at least 6 characters",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user || !user.passwordHash) {
      return res.status(401).json({ ok: false, message: "User not found" });
    }

    const match = await bcrypt.compare(String(currentPassword), user.passwordHash);
    if (!match) {
      return res.status(401).json({ ok: false, message: "Wrong current password" });
    }

    user.passwordHash = await bcrypt.hash(String(newPassword), 10);
    await user.save();

    return res.json({
      ok: true,
      message: "Password updated successfully",
    });
  } catch (e) {
    next(e);
  }
};
