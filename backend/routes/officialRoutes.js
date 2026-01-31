import express from "express";
import {
  getAllOfficials,
  getActiveOfficials,
  getOfficialById,
  createOfficial,
  updateOfficial,
  deleteOfficial,
} from "../controllers/officialController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { uploadOfficialSignature } from "../middleware/uploadMiddleware.js";

const router = express.Router();

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
router.post("/", authenticateToken, uploadOfficialSignature.single("signature"), createOfficial);

// Update official (with optional signature upload)
router.put("/:id", authenticateToken, uploadOfficialSignature.single("signature"), updateOfficial);

// Delete official
router.delete("/:id", authenticateToken, deleteOfficial);

export default router;
