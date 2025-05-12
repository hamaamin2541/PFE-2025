import express from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import {
  createComplaint,
  getAllComplaints,
  getUserComplaints,
  getComplaintById,
  updateComplaintStatus,
  addComment,
  upload
} from '../controllers/complaintController.js';

const router = express.Router();

// Protéger toutes les routes
router.use(protect);

// Routes pour tous les utilisateurs
router.post('/', upload.array('attachments', 5), createComplaint);
router.get('/my-complaints', getUserComplaints);
router.get('/:id', getComplaintById);
router.post('/:id/comments', addComment);

// Routes réservées aux administrateurs
router.get('/', adminOnly, getAllComplaints);
router.put('/:id/status', adminOnly, updateComplaintStatus);

export default router;
