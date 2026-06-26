import express from 'express';
import { getUsers, createUser } from '../controllers/userController.js';

const router = express.Router();

router.route('/')
  .get(getUsers)
  .post(createUser);

export default router;
