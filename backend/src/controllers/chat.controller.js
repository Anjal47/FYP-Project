const { resolveChatFromAppointment } = require("../utils/chatAppointmentResolver");
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");

const normalize = (v) => String(v || "").toLowerCase().trim();

function isParticipantOrThrow(reqUser, convo) {
  const me = String(reqUser._id);
  const u = String(convo.userId);
  const s = String(convo.staffId);

  if (me !== u && me !== s) {
    const err = new Error("Not allowed");
    err.status = 403;
    throw err;
  }
}

function roleFromUser(user) {
  const r = normalize(user?.role);
  if (r === "therapist") return "therapist";
  if (r === "counsellor") return "counsellor";
  return "user";
}

/**
 * GET conversation meta (optional)
 */
async function getOrCreateConversationByAppointment(req, res) {
  try {
    const { appointmentId } = req.params;

    const info = await resolveChatFromAppointment(appointmentId);

    let convo = await Conversation.findOne({ appointmentId: info.appointmentId });

    if (!convo) {
      convo = await Conversation.create({
        appointmentId: info.appointmentId,
        serviceType: info.serviceType, // ✅ REQUIRED
        userId: info.userId,
        staffId: info.staffId,
        staffRole: info.staffRole,
        lastMessageAt: null,
      });
    }

    isParticipantOrThrow(req.user, convo);

    return res.json({
      ok: true,
      conversation: {
        _id: convo._id,
        appointmentId: convo.appointmentId,
        serviceType: convo.serviceType,
        userId: convo.userId,
        staffId: convo.staffId,
        staffRole: convo.staffRole,
      },
    });
  } catch (e) {
    return res.status(e.status || 400).json({ ok: false, message: e.message || "Chat error" });
  }
}

/**
 * GET messages
 */
async function getMessages(req, res) {
  try {
    const { appointmentId } = req.params;

    const info = await resolveChatFromAppointment(appointmentId);

    let convo = await Conversation.findOne({ appointmentId: info.appointmentId });

    if (!convo) {
      convo = await Conversation.create({
        appointmentId: info.appointmentId,
        serviceType: info.serviceType, // ✅ REQUIRED
        userId: info.userId,
        staffId: info.staffId,
        staffRole: info.staffRole,
        lastMessageAt: null,
      });
    }

    isParticipantOrThrow(req.user, convo);

    const msgs = await Message.find({ conversationId: convo._id }).sort({ createdAt: 1 });

    return res.json({ ok: true, messages: msgs });
  } catch (e) {
    return res.status(e.status || 400).json({ ok: false, message: e.message || "Failed to load messages" });
  }
}

/**
 * POST send message
 */
async function sendMessage(req, res) {
  try {
    const { appointmentId } = req.params;
    const text = String(req.body?.text || "").trim();
    if (!text) return res.status(400).json({ ok: false, message: "Message text required" });

    const info = await resolveChatFromAppointment(appointmentId);

    let convo = await Conversation.findOne({ appointmentId: info.appointmentId });

    if (!convo) {
      convo = await Conversation.create({
        appointmentId: info.appointmentId,
        serviceType: info.serviceType, // ✅ REQUIRED
        userId: info.userId,
        staffId: info.staffId,
        staffRole: info.staffRole,
        lastMessageAt: null,
      });
    }

    isParticipantOrThrow(req.user, convo);

    const senderRole = roleFromUser(req.user);

    const msg = await Message.create({
      conversationId: convo._id,
      senderId: req.user._id,
      senderRole,
      text,
      readByUser: senderRole === "user",
      readByStaff: senderRole !== "user",
    });

    convo.lastMessageAt = new Date();
    await convo.save();

    // ✅ realtime broadcast
    if (req.io) {
      req.io.to(`appt:${String(info.appointmentId)}`).emit("chat:newMessage", {
        appointmentId: String(info.appointmentId),
        message: msg,
      });
    }

    return res.json({ ok: true, message: msg });
  } catch (e) {
    return res.status(e.status || 400).json({ ok: false, message: e.message || "Failed to send message" });
  }
}

module.exports = {
  getOrCreateConversationByAppointment,
  getMessages,
  sendMessage,
};
