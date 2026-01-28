import express from "express";
import { createKopSurat, getAllKopSurat, getKopSuratById, updateKopSurat, deleteKopSurat, activateKopSurat, deactivateKopSurat } from "../controllers/kopSuratController.js";

import { authenticateToken, isAdmin } from "../middleware/authMiddleware.js";
import { uploadKopSurat } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/", authenticateToken, isAdmin, uploadKopSurat.single("kop_image"), createKopSurat);
router.get("/", authenticateToken, isAdmin, getAllKopSurat);
router.get("/:id", authenticateToken, isAdmin, getKopSuratById);
router.put("/:id", authenticateToken, isAdmin, uploadKopSurat.single("kop_image"), updateKopSurat);
router.delete("/:id", authenticateToken, isAdmin, deleteKopSurat);

router.patch("/:id/activate", authenticateToken, isAdmin, activateKopSurat);
router.patch("/:id/deactivate", authenticateToken, isAdmin, deactivateKopSurat);

export default router;
