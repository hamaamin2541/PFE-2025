import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import {
  getTests,
  getTestById,
  createTest,
  updateTest,
  deleteTest,
  getTeacherTests
} from '../controllers/testController.js';

const router = express.Router();

// Get all tests
router.get('/', getTests);

// Get teacher's tests
router.get('/teacher/tests', protect, authorize('teacher'), getTeacherTests);

// Get single test
router.get('/:id', getTestById);

// Create a new test (only teachers)
router.post('/',
  protect,
  authorize('teacher'),
  upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'resources', maxCount: 20 } // Allow up to 20 resource files
  ]),
  createTest
);

// Update a test (only teachers)
router.put('/:id',
  protect,
  authorize('teacher'),
  upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'resources', maxCount: 20 } // Allow up to 20 resource files
  ]),
  updateTest
);

// Delete a test (only teachers)
router.delete('/:id', protect, authorize('teacher'), deleteTest);

export default router;
