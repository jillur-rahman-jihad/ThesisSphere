import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getStudentDashboard } from '../controllers/dashboardController.js';
import { getFacultyDashboard } from '../controllers/facultyDashboardController.js';

const router = express.Router();

router.get('/student', protect, getStudentDashboard);
router.get('/faculty', protect, getFacultyDashboard);

export default router;