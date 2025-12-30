const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
require("dotenv").config();

const connectDB = require("./src/config/db");
const { notFound, errorHandler } = require("./src/middleware/error");

const reportRoutes = require("./src/routes/report.routes");
const authRoutes = require("./src/routes/auth.routes");
const adminRoutes = require("./src/routes/admin.routes");
const counselingRoutes = require("./src/routes/counselingRoutes");

const therapyRoutes = require("./src/routes/therapy.routes");


const app = express();

app.use(helmet());
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

connectDB();

app.get("/", (req, res) => res.json({ ok: true, name: "AngelTouch API" }));

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/counseling", counselingRoutes);
app.use("/api/therapy", therapyRoutes);

app.use("/api/therapy", therapyRoutes);



app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`✅ API running on http://localhost:${port}`));
