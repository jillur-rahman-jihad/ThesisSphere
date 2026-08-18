import express from 'express';
import { generateReport } from '../controllers/automatedReportController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/automated-report (requires authentication)
router.get('/', protect, generateReport);

export default router;