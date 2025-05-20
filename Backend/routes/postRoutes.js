import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import {
  createPost,
  getApprovedPosts,
  getPendingPosts,
  updatePostStatus,
  addComment,
  updateCommentStatus,
  addReaction,
  removeReaction,
  upload
} from '../controllers/postController.js';

const router = express.Router();

// Public route to get approved posts
router.get('/approved', getApprovedPosts);

// Protected routes
router.use(protect);

// Routes for all authenticated users
router.post('/', upload.single('image'), createPost);
router.post('/:id/comments', addComment);
router.post('/:id/reactions', addReaction);
router.delete('/:id/reactions', removeReaction);

// Admin-only routes
router.get('/pending', adminOnly, getPendingPosts);
router.put('/:id/status', adminOnly, updatePostStatus);
router.put('/comments/:commentId/status', adminOnly, updateCommentStatus);

export default router;
