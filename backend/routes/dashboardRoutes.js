import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getStudentDashboard,
  updateStudentMilestones,
  getDashboardCounts,
} from '../controllers/dashboardController.js';
import {
  getFacultyDashboard,
  updateSupervisionRequestStatus,
  updateFacultyCapacity,
} from '../controllers/facultyDashboardController.js';

const router = express.Router();

// Student routes
router.get('/student', protect, getStudentDashboard);
router.put('/student/milestones', protect, updateStudentMilestones);

// Faculty routes
router.get('/faculty', protect, getFacultyDashboard);
router.put('/faculty/supervision-requests/:id', protect, updateSupervisionRequestStatus);
router.put('/faculty/capacity', protect, updateFacultyCapacity);

// Shared counts for live navigation badges
router.get('/counts', protect, getDashboardCounts);

export default router;