import express from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';
import {
  getAllExports,
  getUserExports,
  createExport,
  downloadExport
} from '../controllers/exportController.js';

const router = express.Router();

// Custom middleware to handle token in query for downloads
const handleTokenAuth = (req, res, next) => {
  // Check if token is in query params (for direct downloads)
  if (req.query.token) {
    try {
      const decoded = jwt.verify(req.query.token, process.env.JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide ou expiré'
      });
    }
  }

  // If no token in query, use regular auth middleware
  return protect(req, res, next);
};

// Routes for all authenticated users
router.get('/my-exports', protect, getUserExports);
router.post('/', protect, createExport);

// Download route with special auth handling
router.get('/download/:id', handleTokenAuth, downloadExport);

// Admin-only routes
router.get('/', adminOnly, getAllExports);

export default router;
