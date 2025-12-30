const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) return res.status(401).json({ ok: false, message: "Missing token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ IMPORTANT: no .lean() and no .select("-passwordHash")
    const user = await User.findById(decoded.id);

    if (!user) return res.status(401).json({ ok: false, message: "User not found" });
    if (user.isActive === false) return res.status(403).json({ ok: false, message: "Account disabled" });

    req.user = user; // ✅ real mongoose document with passwordHash
    next();
  } catch (err) {
    return res.status(401).json({ ok: false, message: "Invalid or expired token" });
  }
};
