import express from "express";

import {
  getStudentProfile,
  updateStudentProfile,
} from "../controllers/studentProfileController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get logged-in student's profile
router.get("/", protect, getStudentProfile);

// Update logged-in student's profile
router.put("/", protect, updateStudentProfile);

export default router;