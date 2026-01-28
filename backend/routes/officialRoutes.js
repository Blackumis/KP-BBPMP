import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import {
  getAllOfficials,
  getActiveOfficials,
  getOfficialById,
  createOfficial,
  updateOfficial,
  deleteOfficial,
} from "../controllers/officialController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure signatures directory exists
const signaturesDir = path.join(__dirname, "../uploads/signatures");
if (!fs.existsSync(signaturesDir)) {
  fs.mkdirSync(signaturesDir, { recursive: true });
}

// Configure multer for signature uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, signaturesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "signature-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files (JPEG, JPG, PNG) are allowed"));
    }
  },
});

// Protected routes first (more specific paths)
// Get all officials
router.get("/", authenticateToken, getAllOfficials);

// Get active officials only  
router.get("/active", authenticateToken, getActiveOfficials);

// Public route - Get official by ID (for QR verification)
// This must come AFTER /active to avoid catching it
router.get("/:id", (req, res, next) => {
  console.log("Public route hit - Official ID:", req.params.id);
  getOfficialById(req, res, next);
});

// Create new official (with signature upload)
router.post("/", authenticateToken, upload.single("signature"), createOfficial);

// Update official (with optional signature upload)
router.put("/:id", authenticateToken, upload.single("signature"), updateOfficial);

// Delete official
router.delete("/:id", authenticateToken, deleteOfficial);

export default router;
