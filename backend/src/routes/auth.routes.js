const router = require("express").Router();
const c = require("../controllers/auth.controller");
const auth = require("../middleware/auth");

router.post("/register", c.registerUser);
router.post("/login", c.login);

// ✅ profile
router.get("/me", auth, c.me);
router.patch("/me", auth, c.updateMe);
router.patch("/me/email", auth, c.changeMyEmail);
router.patch("/me/password", auth, c.changeMyPassword);

module.exports = router;
