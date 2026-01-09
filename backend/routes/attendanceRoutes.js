import express from 'express';
import {
  getEventForm,
  submitAttendance,
  getEventAttendances,
  getAttendanceById,
  updateAttendance,
  deleteAttendance
} from '../controllers/attendanceController.js';
import { authenticateToken, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/form/:id', getEventForm);
router.post('/submit/:event_id', submitAttendance);

// Admin routes
router.get('/event/:event_id', authenticateToken, isAdmin, getEventAttendances);
router.get('/:id', authenticateToken, isAdmin, getAttendanceById);
router.put('/:id', authenticateToken, isAdmin, updateAttendance);
router.delete('/:id', authenticateToken, isAdmin, deleteAttendance);

export default router;
