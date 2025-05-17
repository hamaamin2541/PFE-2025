import express from 'express';
import { handleChatRequest } from '../controllers/aiController.js';
import { testEnvVariables } from '../controllers/testEnvController.js';
import { testOpenAI } from '../controllers/aiTestController.js';

const router = express.Router();

// Route for AI chat
router.post('/chat', handleChatRequest);

// Test routes
router.get('/test-env', testEnvVariables);
router.get('/test-openai', testOpenAI);

export default router;
