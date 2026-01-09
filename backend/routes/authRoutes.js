import express from 'express';
import { login, register, getProfile, changePassword } from '../controllers/authController.js';
import { authenticateToken, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/login', login);

// Protected routes
router.post('/register', authenticateToken, isAdmin, register);
router.get('/profile', authenticateToken, getProfile);
router.put('/change-password', authenticateToken, changePassword);

export default router;
