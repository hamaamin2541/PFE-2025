import express from 'express';
import { login, register, createAdmin } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/create-admin', createAdmin);

export default router;
