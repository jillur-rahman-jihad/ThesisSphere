import express from 'express';
import { getCalendarEvents, createDeadline } from '../controllers/calendarController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getCalendarEvents);

router.route('/deadline')
  .post(protect, createDeadline);

export default router;
