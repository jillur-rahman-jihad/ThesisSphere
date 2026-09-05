import express from 'express';
import { getUsers, createUser, lookupStudentById } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/student-lookup', protect, lookupStudentById);

router.route('/')
  .get(getUsers)
  .post(createUser);

export default router;
