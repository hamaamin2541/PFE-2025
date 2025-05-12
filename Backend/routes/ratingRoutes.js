import express from 'express';
import { addRating, getRatingStats } from '../controllers/ratingController.js';

const router = express.Router();

// Route pour ajouter une note
router.post('/', addRating);

// Route pour récupérer les statistiques des notes
router.get('/', getRatingStats);

export default router;
