const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../../uploads/reports");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname || "");
    const safeField = String(file.fieldname || "file").replace(/[^a-zA-Z0-9_-]/g, "");
    cb(null, `${safeField}-${Date.now()}${ext}`);
  },
});

const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const allowedVideoTypes = ["video/mp4", "video/quicktime", "video/webm", "video/3gpp"];
const allowedAudioTypes = [
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/aac",
  "audio/wav",
  "audio/x-wav",
  "audio/webm",
  "audio/ogg",
  "audio/3gpp",
  "audio/amr",
];

function fileFilter(req, file, cb) {
  const field = file.fieldname;

  if (field === "photo") {
    if (allowedImageTypes.includes(file.mimetype)) return cb(null, true);
    return cb(new Error("photo must be an image file"));
  }

  if (field === "video") {
    if (allowedVideoTypes.includes(file.mimetype)) return cb(null, true);
    return cb(new Error("video must be a valid video file"));
  }

  if (field === "audio") {
    if (allowedAudioTypes.includes(file.mimetype)) return cb(null, true);
    return cb(new Error("audio must be a valid audio file"));
  }

  return cb(new Error("Unexpected upload field"));
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

module.exports = upload.fields([
  { name: "photo", maxCount: 1 },
  { name: "video", maxCount: 1 },
  { name: "audio", maxCount: 1 },
]);
