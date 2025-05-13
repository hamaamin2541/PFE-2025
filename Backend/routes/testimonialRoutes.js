import express from 'express';
import jwt from 'jsonwebtoken';
import { protect, adminOnly } from '../middleware/auth.js';
import {
  createTestimonial,
  getApprovedTestimonials,
  getAllTestimonials,
  updateTestimonialStatus,
  deleteTestimonial
} from '../controllers/testimonialController.js';

const router = express.Router();

// Routes publiques
router.get('/approved', getApprovedTestimonials);

// Route pour créer un témoignage (peut être utilisée avec ou sans authentification)
// Si l'utilisateur est authentifié, on récupère son ID
router.post('/', (req, res, next) => {
  // Vérifier si le token est présent mais ne pas bloquer la requête s'il est absent
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { _id: decoded.id };
    } catch (error) {
      // Si le token est invalide, on continue sans authentification
      console.log('Invalid token, continuing without authentication');
    }
  }
  next();
}, createTestimonial);

// Routes protégées pour les administrateurs
router.use('/admin', protect);
router.use('/admin', adminOnly);

router.get('/admin', getAllTestimonials);
router.put('/admin/:id', updateTestimonialStatus);
router.delete('/admin/:id', deleteTestimonial);

export default router;
