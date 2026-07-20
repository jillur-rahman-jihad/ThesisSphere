import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getThesisTopics } from '../controllers/thesisBrowseController.js';

const router = express.Router();

router.route('/')
  .get(protect, getThesisTopics);

export default router;
