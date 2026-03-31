const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
require("dotenv").config();

const connectDB = require("./src/config/db");
const { notFound, errorHandler } = require("./src/middleware/error.js");

// ✅ Routes
const authRoutes = require("./src/routes/auth.routes");
const adminRoutes = require("./src/routes/admin.routes");

const reportRoutes = require("./src/routes/report.routes");
const policeRoutes = require("./src/routes/police.routes");
const municipalityRoutes = require("./src/routes/municipalityRoutes");

const counselingRoutes = require("./src/routes/counseling.routes");
const therapyRoutes = require("./src/routes/therapy.routes");

const chatRoutes = require("./src/routes/chat.routes");

// ✅ Traffic routes
const trafficRoutes = require("./src/routes/traffic.routes");

// ✅ Donation routes
const donationRoutes = require("./src/routes/donation.routes");

// ✅ Socket initializer
const { initChatSocket } = require("./src/sockets/chat.socket");

const app = express();

// ✅ Security + logs
app.use(helmet());
app.use(cors({ origin: "*" }));

// 🔥 BODY PARSER (must be BEFORE routes)
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(morgan("dev"));

// ✅ SERVE UPLOADS
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ DB connect
connectDB();

// ✅ Health route
app.get("/", (req, res) => res.json({ ok: true, name: "AngelTouch API" }));

// ✅ API routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

app.use("/api/reports", reportRoutes);
app.use("/api/police", policeRoutes);
app.use("/api/municipality", municipalityRoutes);

app.use("/api/counseling", counselingRoutes);
app.use("/api/therapy", therapyRoutes);
app.use("/api/admin", require("./src/routes/adminReport.routes"));

// ✅ Donation
app.use("/api/donations", donationRoutes);

// ✅ Chat
app.use("/api/chat", chatRoutes);

// ✅ Traffic
app.use("/api/traffic", trafficRoutes);

// ✅ Create HTTP server
const server = http.createServer(app);

// ✅ Socket.io
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// ✅ attach io to req
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ✅ init sockets
initChatSocket(io);

// ✅ errors
app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 5000;

server.listen(port, () =>
  console.log(`✅ API + Socket running on http://localhost:${port}`)
);