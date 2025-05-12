import express from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import {
  getDashboardStats,
  getUsers,
  getUserById,
  updateUser,
  deleteUser
} from '../controllers/adminController.js';

const router = express.Router();

// Protéger toutes les routes d'administration
router.use(protect);
router.use(adminOnly);

// Routes du tableau de bord
router.get('/dashboard', getDashboardStats);

// Routes de gestion des utilisateurs
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

export default router;
