// Backend/routes/chatia.js
import express from 'express';
import { handleChatIA } from '../controllers/chatia.js';

const router = express.Router();

router.post('/chat', handleChatIA);

export default router;