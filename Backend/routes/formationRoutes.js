import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import {
  getFormations,
  getFormationById,
  createFormation,
  updateFormation,
  deleteFormation,
  getTeacherFormations
} from '../controllers/formationController.js';

const router = express.Router();

// Get all formations
router.get('/', getFormations);

// Get teacher's formations
router.get('/teacher/formations', protect, authorize('teacher'), getTeacherFormations);

// Get single formation
router.get('/:id', getFormationById);

// Create a new formation (only teachers)
router.post('/',
  protect,
  authorize('teacher'),
  upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'resources', maxCount: 20 } // Allow up to 20 resource files
  ]),
  createFormation
);

// Update a formation (teachers and admins)
router.put('/:id',
  protect,
  authorize('teacher', 'admin'),
  upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'resources', maxCount: 20 } // Allow up to 20 resource files
  ]),
  updateFormation
);

// Delete a formation (teachers and admins)
router.delete('/:id', protect, authorize('teacher', 'admin'), deleteFormation);

export default router;
