const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const connectDB = require("./src/config/db");
const { notFound, errorHandler } = require("./src/middleware/error");

const authRoutes = require("./src/routes/auth.routes");
const userRoutes = require("./src/routes/user.routes");
const reportingRoutes = require("./src/routes/reporting.routes");
const counselingRoutes = require("./src/routes/counseling.routes");
const trafficRoutes = require("./src/routes/traffic.routes");
const supportRoutes = require("./src/routes/support.routes");
const wasteRoutes = require("./src/routes/waste.routes");
const roadRoutes = require("./src/routes/road.routes");
const sosRoutes = require("./src/routes/sos.routes");

const app = express();

/** 🌈 Security glam: small layers, big slay */
app.use(helmet());
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    message: "Too many requests — breathe bestie 🫶",
  })
);

connectDB();

/** routes */
app.get("/", (req, res) => res.json({ ok: true, name: "AngelTouch API" }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.use("/api/reporting", reportingRoutes);
app.use("/api/counseling", counselingRoutes);
app.use("/api/traffic", trafficRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/waste", wasteRoutes);
app.use("/api/road", roadRoutes);
app.use("/api/sos", sosRoutes);

app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`✅ API running on http://localhost:${port}`));
