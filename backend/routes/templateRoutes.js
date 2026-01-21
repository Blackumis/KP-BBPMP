import express from "express";
import { 
  getAllTemplates, 
  getTemplateById, 
  createTemplate, 
  updateTemplate, 
  deleteTemplate 
} from "../controllers/templateController.js";
import { authenticateToken, isAdmin } from "../middleware/authMiddleware.js";
import { uploadTemplate } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// All template routes require admin authentication
router.get("/", authenticateToken, isAdmin, getAllTemplates);
router.get("/:id", authenticateToken, isAdmin, getTemplateById);
router.post("/", authenticateToken, isAdmin, uploadTemplate.single("image"), createTemplate);
router.put("/:id", authenticateToken, isAdmin, uploadTemplate.single("image"), updateTemplate);
router.delete("/:id", authenticateToken, isAdmin, deleteTemplate);

export default router;
