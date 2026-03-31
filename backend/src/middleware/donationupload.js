const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../../uploads/donations");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname || "");
    const safeField = String(file.fieldname || "file").replace(/[^a-zA-Z0-9_-]/g, "");
    cb(null, `${safeField}-${Date.now()}${ext}`);
  },
});

const allowedImageTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const allowedVideoTypes = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/3gpp",
];

function fileFilter(req, file, cb) {
  const field = file.fieldname;

  if (field === "qrImage" || field === "proofImage") {
    if (allowedImageTypes.includes(file.mimetype)) {
      return cb(null, true);
    }
    return cb(new Error(`${field} must be an image file`));
  }

  if (field === "proofVideo") {
    if (allowedVideoTypes.includes(file.mimetype)) {
      return cb(null, true);
    }
    return cb(new Error("proofVideo must be a video file"));
  }

  return cb(new Error("Unexpected upload field"));
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB max per file
  },
});

const donationUpload = upload.fields([
  { name: "qrImage", maxCount: 1 },
  { name: "proofImage", maxCount: 1 },
  { name: "proofVideo", maxCount: 1 },
]);

module.exports = donationUpload;