import express from "express";
import { generateEventAttendanceReport } from "../controllers/attendanceReportController.js";
import { getEventForm, submitAttendance, getEventAttendances, getAttendanceById, updateAttendance, deleteAttendance } from "../controllers/attendanceController.js";
import { authenticateToken, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/form/:id", getEventForm);
// Accept multipart/form-data with field 'signature' (file)
import { uploadSignature } from "../middleware/uploadMiddleware.js";
router.post("/submit/:event_id", uploadSignature.single("signature"), submitAttendance);

// Admin routes
router.get("/event/:event_id", authenticateToken, isAdmin, getEventAttendances);
router.get("/:id", authenticateToken, isAdmin, getAttendanceById);
router.put("/:id", authenticateToken, isAdmin, updateAttendance);
router.delete("/:id", authenticateToken, isAdmin, deleteAttendance);

// Generate Report
router.get("/events/:event_id/attendance-report", authenticateToken, isAdmin, generateEventAttendanceReport);

export default router;
