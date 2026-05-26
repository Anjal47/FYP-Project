const express = require("express");
const rateLimit = require("express-rate-limit");
const { askHelpChat } = require("../controllers/helpChat.controller");

const router = express.Router();

const helpChatLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    message: "Too many help chat requests. Please wait a moment and try again.",
  },
});

router.post("/", helpChatLimiter, askHelpChat);

module.exports = router;
