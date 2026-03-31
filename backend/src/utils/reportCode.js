// utils/reportCode.js
const Report = require("../models/Report");

/**
 * Generates: AT-YYYY-000001
 * (Simple, readable, user-friendly ✨)
 */
async function generateReportCode() {
  const year = new Date().getFullYear();

  // Find latest report for this year
  const last = await Report.findOne({ reportCode: new RegExp(`^AT-${year}-`) })
    .sort({ createdAt: -1 })
    .select("reportCode")
    .lean();

  let nextNum = 1;
  if (last?.reportCode) {
    const parts = last.reportCode.split("-");
    const lastNum = parseInt(parts[2], 10);
    if (!Number.isNaN(lastNum)) nextNum = lastNum + 1;
  }

  return `AT-${year}-${String(nextNum).padStart(6, "0")}`;
}

module.exports = { generateReportCode };
