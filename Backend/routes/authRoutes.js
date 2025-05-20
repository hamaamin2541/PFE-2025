import express from 'express';
import {
  login,
  register,
  createAdmin,
  add_newuser,
  resetPasswordRequest,
  resetPassword,
  verifyAccount,
  resendVerificationCode,
  sendPasswordToEmail
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
router.post('/send-password-to-email', sendPasswordToEmail);

// Get the preview URL for the last sent email (for development only)
router.get('/last-email-preview', (req, res) => {
  if (process.env.NODE_ENV !== 'production' && global.lastEmailPreviewUrl) {
    return res.status(200).json({
      success: true,
      previewUrl: global.lastEmailPreviewUrl
    });
  } else {
    return res.status(404).json({
      success: false,
      message: 'No email preview URL available'
    });
  }
});

export default router;
