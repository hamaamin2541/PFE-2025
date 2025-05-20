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
    const enrollments = await Enrollment.find({
      paymentStatus: 'completed' // Only count completed payments
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

    let totalRevenue = 0;

    enrollments.forEach(enrollment => {
      // First check if the enrollment has an amount field
      if (enrollment.amount) {
        totalRevenue += enrollment.amount;
      }
      // If not, use the price from the related item
      else if (enrollment.course && enrollment.course.price) {
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

// Obtenir les données pour les rapports
export const getReportData = async (req, res) => {
  try {
    const { dateRange, startDate, endDate } = req.query;

    // Déterminer la plage de dates en fonction du paramètre dateRange
    let dateFilter = {};
    const now = new Date();

    switch (dateRange) {
      case 'last7days':
        dateFilter = { $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7) };
        break;
      case 'last30days':
        dateFilter = { $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30) };
        break;
      case 'last90days':
        dateFilter = { $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90) };
        break;
      case 'thisMonth':
        dateFilter = {
          $gte: new Date(now.getFullYear(), now.getMonth(), 1),
          $lte: new Date(now.getFullYear(), now.getMonth() + 1, 0)
        };
        break;
      case 'lastMonth':
        dateFilter = {
          $gte: new Date(now.getFullYear(), now.getMonth() - 1, 1),
          $lte: new Date(now.getFullYear(), now.getMonth(), 0)
        };
        break;
      case 'thisYear':
        dateFilter = { $gte: new Date(now.getFullYear(), 0, 1) };
        break;
      case 'lastYear':
        dateFilter = {
          $gte: new Date(now.getFullYear() - 1, 0, 1),
          $lte: new Date(now.getFullYear(), 0, 0)
        };
        break;
      case 'custom':
        if (startDate && endDate) {
          dateFilter = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          };
        }
        break;
      default:
        // Par défaut, tous les temps
        break;
    }

    // Statistiques des utilisateurs
    const totalUsers = await User.countDocuments();

    // Compter les nouveaux utilisateurs dans la plage de dates
    let newUsersQuery = {};
    if (Object.keys(dateFilter).length > 0) {
      newUsersQuery.createdAt = dateFilter;
    }
    const newUsers = await User.countDocuments(newUsersQuery);

    // Utilisateurs par rôle
    const students = await User.countDocuments({ role: 'student' });
    const teachers = await User.countDocuments({ role: 'teacher' });
    const admins = await User.countDocuments({ role: 'admin' });

    const usersByRole = [
      { role: 'student', count: students },
      { role: 'teacher', count: teachers },
      { role: 'admin', count: admins }
    ];

    // Utilisateurs par mois
    const usersByMonth = await getUsersByMonth(dateFilter);

    // Statistiques du contenu
    const totalCourses = await Course.countDocuments();
    const totalTests = await Test.countDocuments();
    const totalFormations = await Formation.countDocuments();

    const contentByType = [
      { type: 'courses', count: totalCourses },
      { type: 'tests', count: totalTests },
      { type: 'formations', count: totalFormations }
    ];

    // Contenu par mois
    const contentByMonth = await getContentByMonth(dateFilter);

    // Statistiques des ventes
    let salesQuery = {};
    if (Object.keys(dateFilter).length > 0) {
      salesQuery.enrollmentDate = dateFilter;
    }

    const totalSales = await Enrollment.countDocuments(salesQuery);

    // Calculer le revenu total
    const enrollments = await Enrollment.find({
      ...salesQuery,
      paymentStatus: 'completed' // Only count completed payments
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

    let totalRevenue = 0;
    enrollments.forEach(enrollment => {
      // First check if the enrollment has an amount field
      if (enrollment.amount) {
        totalRevenue += enrollment.amount;
      }
      // If not, use the price from the related item
      else if (enrollment.course && enrollment.course.price) {
        totalRevenue += enrollment.course.price;
      } else if (enrollment.test && enrollment.test.price) {
        totalRevenue += enrollment.test.price;
      } else if (enrollment.formation && enrollment.formation.price) {
        totalRevenue += enrollment.formation.price;
      }
    });

    // Ventes par mois
    const salesByMonth = await getSalesByMonth(dateFilter);

    // Revenus par mois
    const revenueByMonth = await getRevenueByMonthFiltered(dateFilter);

    // Assembler et renvoyer les données
    res.status(200).json({
      success: true,
      data: {
        users: {
          totalUsers,
          newUsers,
          usersByRole,
          usersByMonth
        },
        content: {
          totalContent: totalCourses + totalTests + totalFormations,
          contentByType,
          contentByMonth
        },
        sales: {
          totalRevenue,
          totalSales,
          salesByMonth,
          revenueByMonth
        }
      }
    });
  } catch (error) {
    console.error('Error fetching report data:', error);
    res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors de la récupération des données de rapport'
    });
  }
};

// Obtenir les utilisateurs par mois
const getUsersByMonth = async (dateFilter) => {
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  let matchStage = {};
  if (Object.keys(dateFilter).length > 0) {
    matchStage.createdAt = dateFilter;
  } else {
    matchStage.createdAt = { $gte: twelveMonthsAgo };
  }

  const usersByMonth = await User.aggregate([
    {
      $match: matchStage
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
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

    const found = usersByMonth.find(item =>
      item._id.year === year && item._id.month === month
    );

    const monthName = date.toLocaleString('default', { month: 'short' });
    months.push(monthName);
    counts.push(found ? found.count : 0);
  }

  return { months, counts };
};

// Obtenir le contenu par mois
const getContentByMonth = async (dateFilter) => {
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  let matchStage = {};
  if (Object.keys(dateFilter).length > 0) {
    matchStage.createdAt = dateFilter;
  } else {
    matchStage.createdAt = { $gte: twelveMonthsAgo };
  }

  // Agréger les cours, tests et formations par mois
  const coursesByMonth = await Course.aggregate([
    {
      $match: matchStage
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    }
  ]);

  const testsByMonth = await Test.aggregate([
    {
      $match: matchStage
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    }
  ]);

  const formationsByMonth = await Formation.aggregate([
    {
      $match: matchStage
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    }
  ]);

  // Combiner les résultats
  const contentByMonth = {};

  // Initialiser les mois
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const key = `${year}-${month}`;
    contentByMonth[key] = 0;
  }

  // Ajouter les cours
  coursesByMonth.forEach(item => {
    const key = `${item._id.year}-${item._id.month}`;
    if (contentByMonth[key] !== undefined) {
      contentByMonth[key] += item.count;
    }
  });

  // Ajouter les tests
  testsByMonth.forEach(item => {
    const key = `${item._id.year}-${item._id.month}`;
    if (contentByMonth[key] !== undefined) {
      contentByMonth[key] += item.count;
    }
  });

  // Ajouter les formations
  formationsByMonth.forEach(item => {
    const key = `${item._id.year}-${item._id.month}`;
    if (contentByMonth[key] !== undefined) {
      contentByMonth[key] += item.count;
    }
  });

  // Formater les résultats
  const months = [];
  const counts = [];

  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const key = `${year}-${month}`;

    const monthName = date.toLocaleString('default', { month: 'short' });
    months.push(monthName);
    counts.push(contentByMonth[key]);
  }

  return { months, counts };
};

// Obtenir les ventes par mois
const getSalesByMonth = async (dateFilter) => {
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  let matchStage = {};
  if (Object.keys(dateFilter).length > 0) {
    matchStage.enrollmentDate = dateFilter;
  } else {
    matchStage.enrollmentDate = { $gte: twelveMonthsAgo };
  }

  const salesByMonth = await Enrollment.aggregate([
    {
      $match: matchStage
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

    const found = salesByMonth.find(item =>
      item._id.year === year && item._id.month === month
    );

    const monthName = date.toLocaleString('default', { month: 'short' });
    months.push(monthName);
    counts.push(found ? found.count : 0);
  }

  return { months, counts };
};

// Obtenir les revenus par mois avec filtre
const getRevenueByMonthFiltered = async (dateFilter) => {
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  let query = {};
  if (Object.keys(dateFilter).length > 0) {
    query.enrollmentDate = dateFilter;
  } else {
    query.enrollmentDate = { $gte: twelveMonthsAgo };
  }

  const enrollments = await Enrollment.find({
    ...query,
    paymentStatus: 'completed' // Only count completed payments
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
    // First check if the enrollment has an amount field
    if (enrollment.amount) {
      price = enrollment.amount;
    }
    // If not, use the price from the related item
    else if (enrollment.course && enrollment.course.price) {
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
    months.push(monthName);
    revenues.push(revenueByMonth[key]);
  }

  return { months, revenues };
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
    enrollmentDate: { $gte: twelveMonthsAgo },
    paymentStatus: 'completed' // Only count completed payments
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
    // First check if the enrollment has an amount field
    if (enrollment.amount) {
      price = enrollment.amount;
    }
    // If not, use the price from the related item
    else if (enrollment.course && enrollment.course.price) {
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
