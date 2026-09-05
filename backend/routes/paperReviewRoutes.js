import express from "express";

import {
  createPaperReview,
  getStudentPaperReviews,
  getPaperReviewById,
  updatePaperReview,
  submitPaperReview,
  getMyThesisGroups,
  getStudentPaperStatistics,
  getSupervisorPaperReviews,
  getSupervisorPaperReviewById,
  reviewPaper,
  getSupervisorPaperStatistics,
  getPaperFile,
} from "../controllers/paperReviewController.js";

import { protect } from "../middleware/authMiddleware.js";

import uploadPaper from "../middleware/uploadPaper.js";

const router = express.Router();

// ============================================================
// STUDENT
// ============================================================

// Create paper + upload PDF
router.post(
  "/",
  protect,
  uploadPaper.single("paperFile"),
  createPaperReview
);

// Student papers
router.get(
  "/my-papers",
  protect,
  getStudentPaperReviews
);

// Student statistics
router.get(
  "/student/statistics",
  protect,
  getStudentPaperStatistics
);

// Student thesis groups
router.get(
  "/my-groups",
  protect,
  getMyThesisGroups
);

// Submit paper
router.put(
  "/:paperId/submit",
  protect,
  submitPaperReview
);

// ============================================================
// PDF
// ============================================================

// View/download PDF
router.get(
  "/:paperId/file",
  protect,
  getPaperFile
);

// ============================================================
// SUPERVISOR
// ============================================================

router.get(
  "/supervisor/papers",
  protect,
  getSupervisorPaperReviews
);

router.get(
  "/supervisor/statistics",
  protect,
  getSupervisorPaperStatistics
);

router.get(
  "/supervisor/:paperId",
  protect,
  getSupervisorPaperReviewById
);

// Faculty review
router.put(
  "/:paperId/review",
  protect,
  reviewPaper
);

// ============================================================
// GENERAL PAPER ROUTES
// ============================================================

router.get(
  "/:paperId",
  protect,
  getPaperReviewById
);

router.put(
  "/:paperId",
  protect,
  uploadPaper.single("paperFile"),
  updatePaperReview
);

export default router;