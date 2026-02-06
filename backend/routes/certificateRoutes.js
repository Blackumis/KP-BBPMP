import express from 'express';
import {
  generateSingleCertificate,
  generateEventCertificates,
  sendCertificate,
  sendEventCertificates,
  getCertificateHistory,
  validateCertificate,
  downloadCertificate,
  getQueueStatus,
  retryFailedJobs,
  cleanCompletedJobs
} from '../controllers/certificateController.js';
import { authenticateToken, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes for certificate validation and download (no authentication required)
router.get('/validate/:certificate_number', validateCertificate);
router.get('/download/:certificate_number', downloadCertificate);

// All other certificate routes require admin authentication
router.post('/generate/:attendance_id', authenticateToken, isAdmin, generateSingleCertificate);
router.post('/generate-event/:event_id', authenticateToken, isAdmin, generateEventCertificates);
router.post('/send/:attendance_id', authenticateToken, isAdmin, sendCertificate);
router.post('/send-event/:event_id', authenticateToken, isAdmin, sendEventCertificates);
router.get('/history/:event_id', authenticateToken, isAdmin, getCertificateHistory);

// Queue management routes
router.get('/queue/status', authenticateToken, isAdmin, getQueueStatus);
router.get('/queue/status/:event_id', authenticateToken, isAdmin, getQueueStatus);
router.post('/queue/retry/:queue_type', authenticateToken, isAdmin, retryFailedJobs);
router.post('/queue/clean', authenticateToken, isAdmin, cleanCompletedJobs);


export default router;
