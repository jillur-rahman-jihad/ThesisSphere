import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { updateFacultyProfile, getFacultyProfileById, addStudentToSupervisor, acceptSupervisionRequest, rejectSupervisionRequest, getSupervisionRequestDetails } from '../controllers/facultyController.js';
import { getAllSupervisors } from '../controllers/supervisorController.js';

const router = express.Router();

router.put('/profile', protect, updateFacultyProfile);
router.get('/profile/:id', protect, getFacultyProfileById);
router.post('/profile/:id/add-student', protect, addStudentToSupervisor);
router.post('/profile/:id/accept-request', protect, acceptSupervisionRequest);
router.post('/profile/:id/reject-request', protect, rejectSupervisionRequest);
router.get('/supervision-request/:requestId', protect, getSupervisionRequestDetails);
router.get('/supervisors', protect, getAllSupervisors);

export default router;
