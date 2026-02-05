import express from "express";
import { generateEventAttendanceReport } from "../controllers/attendanceReportController.js";
import { getEventForm, submitAttendance, getEventAttendances, getAttendanceById, updateAttendance, deleteAttendance, generateAttendanceTokenHandler } from "../controllers/attendanceController.js";
import { authenticateToken, isAdmin } from "../middleware/authMiddleware.js";
import { uploadSignature } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Public routes (use opaque token instead of exposing id/name)
router.get("/form/:token", getEventForm);
// Accept multipart/form-data with field 'signature' (file)
router.post("/submit/:token", uploadSignature.single("signature"), submitAttendance);

// Admin routes
// Admin can generate opaque tokens for public links
router.get("/generate-token/:event_id", authenticateToken, isAdmin, generateAttendanceTokenHandler);
router.get("/event/:event_id", authenticateToken, isAdmin, getEventAttendances);
router.get("/:id", authenticateToken, isAdmin, getAttendanceById);
router.put("/:id", authenticateToken, isAdmin, updateAttendance);
router.delete("/:id", authenticateToken, isAdmin, deleteAttendance);

// Generate Report
router.get("/events/:event_id/attendance-report", authenticateToken, isAdmin, generateEventAttendanceReport);

export default router;
