import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import {
  getDashboardStats,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getReportData, getTeacherRevenue
} from '../controllers/adminController.js';

const router = express.Router();

// Protéger toutes les routes d'administration
router.use(protect);
router.use(adminOnly);

// Routes du tableau de bord
router.get('/dashboard', getDashboardStats);

// Routes des rapports
router.get('/reports', getReportData);

// Routes de gestion des utilisateurs
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/prof',getTeacherRevenue)

export default router;
