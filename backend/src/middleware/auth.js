const jwt = require("jsonwebtoken");

module.exports = async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ ok: false, message: "Missing token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = { _id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    return res.status(401).json({ ok: false, message: "Invalid token" });
  }
};