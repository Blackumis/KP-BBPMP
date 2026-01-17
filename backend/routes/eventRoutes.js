import express from "express";
import { createEvent, getAllEvents, getEventById, updateEvent, deleteEvent, generateFormLink, activateEvent} from "../controllers/eventController.js";
import { authenticateToken, isAdmin } from "../middleware/authMiddleware.js";
import { uploadTemplate } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// All event routes require admin authentication
router.post("/", authenticateToken, isAdmin, uploadTemplate.single("template"), createEvent);
router.get("/", authenticateToken, isAdmin, getAllEvents);
router.get("/:id", authenticateToken, isAdmin, getEventById);
router.put("/:id", authenticateToken, isAdmin, uploadTemplate.single("template"), updateEvent);
router.delete("/:id", authenticateToken, isAdmin, deleteEvent);
router.post("/:id/generate-link", authenticateToken, isAdmin, generateFormLink);
router.patch("/:id/activate", authenticateToken, isAdmin, activateEvent);

export default router;
