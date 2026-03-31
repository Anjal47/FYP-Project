const jwt = require("jsonwebtoken");
const Conversation = require("../models/Conversation");
const User = require("../models/User");

function getToken(socket) {
  // allow token from auth or query
  return socket.handshake?.auth?.token || socket.handshake?.query?.token || null;
}

function initChatSocket(io) {
  // auth socket
  io.use(async (socket, next) => {
    try {
      const token = getToken(socket);
      if (!token) return next(new Error("No token"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) return next(new Error("User not found"));
      if (user.isActive === false) return next(new Error("Account disabled"));

      socket.user = user;
      next();
    } catch (e) {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    // client sends appointmentId to join room
    socket.on("chat:join", async ({ appointmentId }) => {
      try {
        if (!appointmentId) return;

        // if conversation exists, verify participant
        const convo = await Conversation.findOne({ appointmentId });

        if (convo) {
          const me = String(socket.user._id);
          const u = String(convo.userId);
          const s = String(convo.staffId);

          if (me !== u && me !== s) {
            socket.emit("chat:error", { message: "Not allowed" });
            return;
          }
        }

        socket.join(`appt:${appointmentId}`);
        socket.emit("chat:joined", { ok: true, appointmentId });
      } catch (e) {
        socket.emit("chat:error", { message: e.message || "Join failed" });
      }
    });

    // optional typing event
    socket.on("chat:typing", ({ appointmentId, typing }) => {
      if (!appointmentId) return;
      socket.to(`appt:${appointmentId}`).emit("chat:typing", {
        appointmentId,
        typing: !!typing,
        userId: String(socket.user._id),
      });
    });
  });
}

module.exports = { initChatSocket };
