import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { updateFacultyProfile } from '../controllers/facultyController.js';
import { getAllSupervisors } from '../controllers/supervisorController.js';

const router = express.Router();

router.put('/profile', protect, updateFacultyProfile);
router.get('/supervisors', protect, getAllSupervisors);

export default router;
