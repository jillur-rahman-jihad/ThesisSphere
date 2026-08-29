import express from "express";

import { protect } from "../middleware/authMiddleware.js";

import {
  getSupervisorGroups,
  getSupervisorGroupDetails,
  updateGroupProgress,
  updateMemberResponsibility,
  removeMemberFromGroup,
  assignStudentToGroup,
  getAvailableStudents,
} from "../controllers/supervisorGroupManagerController.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Supervisor's groups
router.get(
  "/groups",
  getSupervisorGroups
);

// Single group details
router.get(
  "/groups/:groupId",
  getSupervisorGroupDetails
);

// Update group progress
router.put(
  "/groups/:groupId/progress",
  updateGroupProgress
);

// Update member role/chapter
router.put(
  "/groups/:groupId/members/:memberId",
  updateMemberResponsibility
);

// Remove member
router.delete(
  "/groups/:groupId/members/:memberId",
  removeMemberFromGroup
);

// Assign existing student
router.post(
  "/groups/:groupId/members",
  assignStudentToGroup
);

// Students available for assignment
router.get(
  "/students",
  getAvailableStudents
);

export default router;
