import express from 'express';
import {
  getGroupContributions,
  addContribution,
  updateContribution,
  deleteContribution,
  seedGroupContributions,
} from '../controllers/contributionTrackerController.js';

const router = express.Router();

// GET group analytics and contributions list
router.get('/group/:groupId', getGroupContributions);

// POST log new contribution
router.post('/', addContribution);

// PUT update existing contribution
router.put('/:id', updateContribution);

// DELETE remove contribution
router.delete('/:id', deleteContribution);

// POST seed sample contributions for testing across student profiles
router.post('/seed/:groupId', seedGroupContributions);

export default router;
