import express from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import {
  getAllExports,
  getUserExports,
  createExport,
  downloadExport,
  generateReport
} from '../controllers/exportController.js';

const router = express.Router();

// Custom middleware to handle token in query for downloads
const handleTokenAuth = (req, res, next) => {
  console.log('handleTokenAuth middleware called');

  // Check if token is in query params (for direct downloads)
  if (req.query.token) {
    console.log('Token found in query params');
    try {
      const decoded = jwt.verify(req.query.token, process.env.JWT_SECRET);
      console.log('Token verified successfully, decoded:', decoded);

      // Find the user in the database
      User.findById(decoded.id)
        .then(user => {
          if (!user) {
            console.log('User not found for token');
            return res.status(401).json({
              success: false,
              message: 'Utilisateur non trouvé'
            });
          }

          console.log('User found:', user.email);
          req.user = user;
          return next();
        })
        .catch(err => {
          console.error('Error finding user:', err);
          return res.status(500).json({
            success: false,
            message: 'Erreur lors de la recherche de l\'utilisateur'
          });
        });
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({
        success: false,
        message: 'Token invalide ou expiré'
      });
    }
  } else {
    console.log('No token in query, using regular auth middleware');
    // If no token in query, use regular auth middleware
    return protect(req, res, next);
  }
};

// Routes for all authenticated users
router.get('/my-exports', protect, getUserExports);
router.post('/', protect, createExport);

// Download route with special auth handling
router.get('/download/:id', handleTokenAuth, downloadExport);

// Admin-only routes
router.get('/', protect, adminOnly, getAllExports);
router.post('/report', protect, adminOnly, generateReport);

export default router;
