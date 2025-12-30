require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const connectDB = require("../config/db");
const User = require("../models/User");

async function seedAdmin() {
  try {
    await connectDB();

    const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || "";

    if (!adminEmail || !adminPassword) {
      console.log("❌ Missing ADMIN_EMAIL or ADMIN_PASSWORD in .env");
      process.exit(1);
    }

    const exists = await User.findOne({ email: adminEmail });
    if (exists) {
      console.log("⚠️ Admin already exists:", exists.email);
      await mongoose.connection.close();
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash(adminPassword, 10);

    await User.create({
      fullName: "System Admin",
      email: adminEmail,
      passwordHash,
      role: "admin",
      isActive: true,
    });

    console.log("✅ Admin seeded:", adminEmail);

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("❌ Admin seed failed:", err.message);
    try {
      await mongoose.connection.close();
    } catch {}
    process.exit(1);
  }
}

seedAdmin();
