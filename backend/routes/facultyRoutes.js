import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { updateFacultyProfile, getFacultyProfileById, addStudentToSupervisor } from '../controllers/facultyController.js';
import { getAllSupervisors } from '../controllers/supervisorController.js';

const router = express.Router();

router.put('/profile', protect, updateFacultyProfile);
router.get('/profile/:id', protect, getFacultyProfileById);
router.post('/profile/:id/add-student', protect, addStudentToSupervisor);
router.get('/supervisors', protect, getAllSupervisors);

export default router;
