import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  applyForTopic,
  getMyApplications,
  getTopicApplications,
  updateApplicationStatus,
} from '../controllers/thesisApplicationController.js';

const router = express.Router();

router.route('/')
  .post(protect, applyForTopic);

router.route('/my-applications')
  .get(protect, getMyApplications);

router.route('/topic/:topicId')
  .get(protect, getTopicApplications);

router.route('/:id/status')
  .put(protect, updateApplicationStatus);

export default router;
