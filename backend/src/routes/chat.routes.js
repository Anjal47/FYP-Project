const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const { getMessages, sendMessage } = require("../controllers/chat.controller");

router.get("/conversations/:appointmentId/messages", auth, getMessages);
router.post("/conversations/:appointmentId/messages", auth, sendMessage);

module.exports = router;
