import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { downloadDocument, downloadDocumentByFilename } from '../controllers/documentController.js';

const router = express.Router();

// Protected routes (require authentication)
router.get('/download/:contentType/:contentId/:resourceId', protect, downloadDocument);

// Simpler route for direct downloads by filename
router.get('/download-file/:filename', protect, downloadDocumentByFilename);

export default router;
