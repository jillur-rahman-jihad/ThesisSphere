import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  createVideoMeeting,
  getVideoMeeting,
  endVideoMeeting,
} from '../controllers/videoMeetingController.js';

const router = express.Router();

router.route('/').post(protect, createVideoMeeting);
router.route('/:meetingId').get(protect, getVideoMeeting);
router.route('/:meetingId/end').put(protect, endVideoMeeting);

export default router;
