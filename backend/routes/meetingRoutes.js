import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getMeetings,
  getGroups,
  createMeeting,
  updateMeeting,
  deleteMeeting,
} from '../controllers/meetingController.js';

const router = express.Router();

router.route('/')
  .get(protect, getMeetings)
  .post(protect, createMeeting);

router.get('/groups', protect, getGroups);

router.route('/:id')
  .put(protect, updateMeeting)
  .delete(protect, deleteMeeting);

export default router;
