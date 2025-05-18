import express from 'express';
import {
  login,
  register,
  createAdmin,
  add_newuser,
  resetPasswordRequest,
  resetPassword,
  verifyAccount,
  resendVerificationCode
} from '../controllers/authController.js';


const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/add_newuser', add_newuser);
router.post('/create-admin', createAdmin);
router.post('/reset-password-request', resetPasswordRequest);
router.post('/reset-password', resetPassword);
router.post('/verify-account', verifyAccount);
router.post('/resend-verification', resendVerificationCode);

export default router;
