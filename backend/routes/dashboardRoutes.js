import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getStudentDashboard } from '../controllers/dashboardController.js';

const router = express.Router();

router.get('/student', protect, getStudentDashboard);

export default router;