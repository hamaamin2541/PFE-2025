import express from 'express';
import { protect } from '../middleware/auth.js';
import { 
  getDashboard, 
  updateUserProfile, 
  changePassword, 
  uploadProfileImage, 
  upload,
  getUsersByRole,
  getTeacherProfile 
} from '../controllers/userController.js';

const router = express.Router();

// Public routes
router.get('/byRole/:role', getUsersByRole);

// Protected routes
router.use(protect);
router.get('/dashboard', getDashboard);
router.get('/teacher-profile', getTeacherProfile);
router.put('/update-profile', updateUserProfile);
router.put('/change-password', changePassword);
router.post('/upload-profile-image', upload.single('profileImage'), uploadProfileImage);

export default router;