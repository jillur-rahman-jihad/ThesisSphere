import express from 'express';
import {
  getForumPosts,
  getForumPostById,
  createForumPost,
  addComment,
  toggleLikePost,
  toggleResolvedStatus,
  deleteForumPost,
  deleteComment,
} from '../controllers/forumController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getForumPosts);
router.get('/:id', getForumPostById);

// Protected routes
router.post('/', protect, createForumPost);
router.post('/:id/comments', protect, addComment);
router.put('/:id/like', protect, toggleLikePost);
router.put('/:id/resolve', protect, toggleResolvedStatus);
router.delete('/:id', protect, deleteForumPost);
router.delete('/:id/comments/:commentId', protect, deleteComment);

export default router;
