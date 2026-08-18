import express from 'express';
import { generateCitation, getUserCitations } from '../controllers/citationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(protect, getUserCitations);
router.route('/generate').post(protect, generateCitation);

export default router;
