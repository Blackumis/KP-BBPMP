import express from 'express';
import { getKabupatenKota } from '../controllers/referenceController.js';

const router = express.Router();

// Public route - anyone can access reference data
router.get('/kabupaten-kota', getKabupatenKota);

export default router;
