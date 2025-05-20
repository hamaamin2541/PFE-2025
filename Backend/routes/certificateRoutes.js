import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  generateCertificate,
  getCertificateById,
  verifyCertificate,
  downloadCertificate,
  getUserCertificates
} from '../controllers/certificateController.js';

const router = express.Router();

// Protected routes (require authentication)
router.get('/my-certificates', protect, getUserCertificates);
router.post('/generate/:enrollmentId', protect, generateCertificate);
router.get('/:certificateId', protect, getCertificateById);

// Public routes (no authentication required)
router.get('/verify/:certificateId', verifyCertificate);
router.get('/download/:certificateId', downloadCertificate);

export default router;
