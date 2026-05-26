const nodemailer = require("nodemailer");

let transporter = null;

function getMailerConfig() {
  const service = String(process.env.MAIL_SERVICE || "").trim();
  const host = String(process.env.MAIL_HOST || "").trim();
  const port = Number(process.env.MAIL_PORT || 0);
  const secure = String(process.env.MAIL_SECURE || "false").trim() === "true";
  const user = String(process.env.MAIL_USER || "").trim();
  const pass = String(process.env.MAIL_PASS || "").trim();

  if (!user || !pass) {
    throw new Error("Mail service is not configured");
  }

  if (service) {
    return {
      service,
      auth: { user, pass },
    };
  }

  if (!host || !port) {
    throw new Error("Mail service is not configured");
  }

  return {
    host,
    port,
    secure,
    auth: { user, pass },
  };
}

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport(getMailerConfig());
  }

  return transporter;
}

async function sendMail(options) {
  const mailer = getTransporter();
  return mailer.sendMail({
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    ...options,
  });
}

module.exports = {
  sendMail,
};
