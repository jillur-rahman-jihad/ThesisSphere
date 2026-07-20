import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { createThesisTopic, updateThesisTopic, deleteThesisTopic } from '../controllers/thesisPostController.js';

const router = express.Router();

router.route('/')
  .post(protect, createThesisTopic);

router.route('/:id')
  .put(protect, updateThesisTopic)
  .delete(protect, deleteThesisTopic);

export default router;
