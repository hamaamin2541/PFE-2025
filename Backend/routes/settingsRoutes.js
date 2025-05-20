import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import {
  getSettings,
  updateSettings,
  resetSettings,
  testEmailConfig
} from '../controllers/settingsController.js';

const router = express.Router();

// Protect all settings routes
router.use(protect);
router.use(adminOnly);

// Get all settings
router.get('/', getSettings);

// Update settings for a specific section
router.put('/:section', updateSettings);

// Reset settings to default
router.post('/reset', resetSettings);

// Test email configuration
router.post('/test-email', testEmailConfig);

export default router;
