import express from 'express';
import {
  generateSingleCertificate,
  generateEventCertificates,
  sendCertificate,
  sendEventCertificates,
  getCertificateHistory
} from '../controllers/certificateController.js';
import { authenticateToken, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// All certificate routes require admin authentication
router.post('/generate/:attendance_id', authenticateToken, isAdmin, generateSingleCertificate);
router.post('/generate-event/:event_id', authenticateToken, isAdmin, generateEventCertificates);
router.post('/send/:attendance_id', authenticateToken, isAdmin, sendCertificate);
router.post('/send-event/:event_id', authenticateToken, isAdmin, sendEventCertificates);
router.get('/history/:event_id', authenticateToken, isAdmin, getCertificateHistory);


export default router;
