import User from '../models/User.js';
import Course from '../models/Course.js';
import Test from '../models/Test.js';
import Formation from '../models/Formation.js';
import Enrollment from '../models/Enrollment.js';
import Complaint from '../models/Complaint.js';
import ContactMessage from '../models/ContactMessage.js';
import Message from '../models/Message.js';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Obtenir les statistiques du tableau de bord admin
export const getDashboardStats = async (req, res) => {
  try {
    // Statistiques des utilisateurs
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalTeachers = await User.countDocuments({ role: 'teacher' });

    // Statistiques du contenu
    const totalCourses = await Course.countDocuments();
    const totalTests = await Test.countDocuments();
    const totalFormations = await Formation.countDocuments();

    // Statistiques des inscriptions
    const totalEnrollments = await Enrollment.countDocuments();

    // Statistiques des revenus
    const enrollments = await Enrollment.find()
      .populate({
        path: 'course',
        select: 'price'
      })
      .populate({
        path: 'test',
        select: 'price'
      })
      .populate({
        path: 'formation',
        select: 'price'
      });

    let totalRevenue = 0;

    enrollments.forEach(enrollment => {
      if (enrollment.course && enrollment.course.price) {
        totalRevenue += enrollment.course.price;
      } else if (enrollment.test && enrollment.test.price) {
        totalRevenue += enrollment.test.price;
      } else if (enrollment.formation && enrollment.formation.price) {
        totalRevenue += enrollment.formation.price;
      }
    });

    // Statistiques des réclamations
    const totalComplaints = await Complaint.countDocuments();
    const pendingComplaints = await Complaint.countDocuments({ status: 'pending' });
    const resolvedComplaints = await Complaint.countDocuments({ status: 'resolved' });

    // Statistiques des messages de contact
    const totalContactMessages = await ContactMessage.countDocuments();
    const unreadContactMessages = await ContactMessage.countDocuments({ status: 'unread' });

    // Statistiques des messages internes
    const totalMessages = await Message.countDocuments();

    // Utilisateurs récemment inscrits
    const recentUsers = await User.find()
      .sort('-createdAt')
      .limit(5)
      .select('fullName email role createdAt');

    // Réclamations récentes
    const recentComplaints = await Complaint.find()
      .sort('-createdAt')
      .limit(5)
      .populate('user', 'fullName email')
      .select('subject type status priority createdAt');

    // Messages de contact récents
    const recentContactMessages = await ContactMessage.find()
      .sort('-createdAt')
      .limit(5)
      .select('name email subject status createdAt');

    // Données pour les graphiques

    // Inscriptions par mois (12 derniers mois)
    const enrollmentsByMonth = await getEnrollmentsByMonth();

    // Revenus par mois (12 derniers mois)
    const revenueByMonth = await getRevenueByMonth();

    // Utilisateurs par rôle
    const usersByRole = [
      { role: 'student', count: totalStudents },
      { role: 'teacher', count: totalTeachers },
      { role: 'admin', count: totalUsers - totalStudents - totalTeachers }
    ];

    // Contenu par type
    const contentByType = [
      { type: 'course', count: totalCourses },
      { type: 'test', count: totalTests },
      { type: 'formation', count: totalFormations }
    ];

    res.status(200).json({
      success: true,
      data: {
        counts: {
          users: {
            total: totalUsers,
            students: totalStudents,
            teachers: totalTeachers
          },
          content: {
            courses: totalCourses,
            tests: totalTests,
            formations: totalFormations,
            total: totalCourses + totalTests + totalFormations
          },
          enrollments: totalEnrollments,
          revenue: totalRevenue,
          complaints: {
            total: totalComplaints,
            pending: pendingComplaints,
            resolved: resolvedComplaints
          },
          contactMessages: {
            total: totalContactMessages,
            unread: unreadContactMessages
          },
          messages: totalMessages
        },
        recent: {
          users: recentUsers,
          complaints: recentComplaints,
          contactMessages: recentContactMessages
        },
        charts: {
          enrollmentsByMonth,
          revenueByMonth,
          usersByRole,
          contentByType
        }
      }
    });
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors de la récupération des statistiques'
    });
  }
};

// Obtenir la liste des utilisateurs (avec filtres et pagination)
export const getUsers = async (req, res) => {
  try {
    const { role, search, sort = '-createdAt' } = req.query;

    // Construire la requête
    let query = {};

    if (role) query.role = role;

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find(query)
      .select('-password')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors de la récupération des utilisateurs'
    });
  }
};

// Obtenir un utilisateur par ID
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors de la récupération de l\'utilisateur'
    });
  }
};

// Mettre à jour un utilisateur
export const updateUser = async (req, res) => {
  try {
    const { fullName, email, role, specialty, bio, phone } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Mettre à jour les champs
    if (fullName) user.fullName = fullName;
    if (email) user.email = email;
    if (role) user.role = role;
    if (specialty !== undefined) user.specialty = specialty;
    if (bio !== undefined) user.bio = bio;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    res.status(200).json({
      success: true,
      data: user,
      message: 'Utilisateur mis à jour avec succès'
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors de la mise à jour de l\'utilisateur'
    });
  }
};

// Supprimer un utilisateur
export const deleteUser = async (req, res) => {
  try {
    const result = await User.findByIdAndDelete(req.params.id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors de la suppression de l\'utilisateur'
    });
  }
};

// Fonctions utilitaires pour les statistiques

// Obtenir les inscriptions par mois (12 derniers mois)
const getEnrollmentsByMonth = async () => {
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const enrollmentsByMonth = await Enrollment.aggregate([
    {
      $match: {
        enrollmentDate: { $gte: twelveMonthsAgo }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$enrollmentDate' },
          month: { $month: '$enrollmentDate' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: {
        '_id.year': 1,
        '_id.month': 1
      }
    }
  ]);

  // Formater les résultats
  const months = [];
  const counts = [];

  // Remplir les 12 derniers mois
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    const found = enrollmentsByMonth.find(item =>
      item._id.year === year && item._id.month === month
    );

    const monthName = date.toLocaleString('default', { month: 'short' });
    months.push(`${monthName} ${year}`);
    counts.push(found ? found.count : 0);
  }

  return { months, counts };
};

// Obtenir les revenus par mois (12 derniers mois)
const getRevenueByMonth = async () => {
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const enrollments = await Enrollment.find({
    enrollmentDate: { $gte: twelveMonthsAgo }
  })
    .populate({
      path: 'course',
      select: 'price'
    })
    .populate({
      path: 'test',
      select: 'price'
    })
    .populate({
      path: 'formation',
      select: 'price'
    });

  // Initialiser les revenus pour les 12 derniers mois
  const revenueByMonth = {};

  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const key = `${year}-${month}`;
    revenueByMonth[key] = 0;
  }

  // Calculer les revenus par mois
  enrollments.forEach(enrollment => {
    const date = new Date(enrollment.enrollmentDate);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const key = `${year}-${month}`;

    let price = 0;
    if (enrollment.course && enrollment.course.price) {
      price = enrollment.course.price;
    } else if (enrollment.test && enrollment.test.price) {
      price = enrollment.test.price;
    } else if (enrollment.formation && enrollment.formation.price) {
      price = enrollment.formation.price;
    }

    if (revenueByMonth[key] !== undefined) {
      revenueByMonth[key] += price;
    }
  });

  // Formater les résultats
  const months = [];
  const revenues = [];

  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const key = `${year}-${month}`;

    const monthName = date.toLocaleString('default', { month: 'short' });
    months.push(`${monthName} ${year}`);
    revenues.push(revenueByMonth[key]);
  }

  return { months, revenues };
};
