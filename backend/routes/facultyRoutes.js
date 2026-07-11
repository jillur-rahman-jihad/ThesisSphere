import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { updateFacultyProfile } from '../controllers/facultyController.js';

const router = express.Router();

router.put('/profile', protect, updateFacultyProfile);

export default router;
