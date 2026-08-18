import express from "express";

import {
  getMyGroup,
  getAllGroups,
  requestToJoinGroup,
  createThesisGroup,
  acceptJoinRequest,
  rejectJoinRequest,
} from "../controllers/thesisGroupController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/my-group", protect, getMyGroup);

router.get("/", protect, getAllGroups);

router.post("/", protect, createThesisGroup);

router.post("/:id/request", protect, requestToJoinGroup);

router.post(
  "/:id/requests/:requestId/accept",
  protect,
  acceptJoinRequest
);

router.post(
  "/:id/requests/:requestId/reject",
  protect,
  rejectJoinRequest
);

export default router;