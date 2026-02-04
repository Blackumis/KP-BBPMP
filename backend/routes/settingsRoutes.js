import express from "express";
import { getSmtpSettings, updateSmtpSettings, testSmtpConnection } from "../controllers/settingsController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// All settings routes require authentication
router.use(authenticateToken);

// SMTP Settings
router.get("/smtp", getSmtpSettings);
router.put("/smtp", updateSmtpSettings);
router.post("/smtp/test", testSmtpConnection);

export default router;
