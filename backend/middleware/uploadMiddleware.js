import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import pool from "../config/database.js";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadTemplateDir = path.join(__dirname, "../uploads/templates");
if (!fs.existsSync(uploadTemplateDir)) {
  fs.mkdirSync(uploadTemplateDir, { recursive: true });
}

// Storage configuration for templates
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadTemplateDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "template-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// Setup uploads dir for signatures
const uploadSignatureDir = path.join(__dirname, "../uploads/signatures");
if (!fs.existsSync(uploadSignatureDir)) {
  fs.mkdirSync(uploadSignatureDir, { recursive: true });
}

const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const signatureStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadSignatureDir);
  },

  filename: async (req, file, cb) => {
    try {
      const { event_id } = req.params;
      const { nama_lengkap } = req.body;

      // Ambil nama kegiatan dari DB
      const [rows] = await pool.query(
        "SELECT nama_kegiatan FROM kegiatan WHERE id = ?",
        [event_id]
      );

      const eventName = rows.length
        ? rows[0].nama_kegiatan
        : "event";

      const eventSlug = slugify(eventName);
      const nameSlug = nama_lengkap
        ? slugify(nama_lengkap)
        : "peserta";

      const ext = path.extname(file.originalname);
      const timestamp = Date.now();

      cb(
        null,
        `signature-${eventSlug}-${nameSlug}-${timestamp}${ext}`
      );
    } catch (error) {
      cb(error);
    }
  },
});

const uploadKopSuratDir = path.join(__dirname, "../uploads/kop-surat");
if (!fs.existsSync(uploadKopSuratDir)) {
  fs.mkdirSync(uploadKopSuratDir, { recursive: true });
}
const kopSuratStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadKopSuratDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `kop-${unique}${ext}`);
  },
});

// Setup uploads dir for official signatures
const uploadOfficialSignatureDir = path.join(__dirname, "../uploads/pejabat/signatures");
if (!fs.existsSync(uploadOfficialSignatureDir)) {
  fs.mkdirSync(uploadOfficialSignatureDir, { recursive: true });
}
const officialSignatureStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadOfficialSignatureDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `official-signature-${unique}${ext}`);
  },
});
const officialSignatureFileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) cb(null, true);
  else cb(new Error("Only PNG/JPEG images allowed for official signatures"));
};
export const uploadOfficialSignature = multer({
  storage: officialSignatureStorage,
  limits: {
    fileSize: parseInt(process.env.MAX_SIGNATURE_SIZE) || 2 * 1024 * 1024, // 2MB
  },
  fileFilter: officialSignatureFileFilter,
});
const kopSuratFileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) cb(null, true);
  else cb(new Error("Only JPG/PNG allowed for kop surat"));
};
export const uploadKopSurat = multer({
  storage: kopSuratStorage,
  limits: {
    fileSize: parseInt(process.env.MAX_KOP_SURAT_SIZE) || 2 * 1024 * 1024, // 2MB
  },
  fileFilter: kopSuratFileFilter,
});



// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files (JPEG, PNG) and PDF are allowed"));
  }
};

// Multer upload configuration
export const uploadTemplate = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
  },
  fileFilter: fileFilter,
});

// Signature upload (PNG/JPEG only, keep size small)
export const uploadSignature = multer({
  storage: signatureStorage,
  limits: {
    fileSize: parseInt(process.env.MAX_SIGNATURE_SIZE) || 2 * 1024 * 1024, // 2MB default
  },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) cb(null, true);
    else cb(new Error("Only PNG/JPEG images allowed for signatures"));
  },
});
