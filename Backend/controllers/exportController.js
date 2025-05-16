import Export from '../models/Export.js';
import Course from '../models/Course.js';
import Test from '../models/Test.js';
import Formation from '../models/Formation.js';
import User from '../models/User.js';
import Enrollment from '../models/Enrollment.js';
import Complaint from '../models/Complaint.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import PDFDocument from 'pdfkit';
import archiver from 'archiver';
import { Parser } from 'json2csv';
import ExcelJS from 'exceljs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure exports directory exists
const exportsDir = join(__dirname, '..', 'uploads', 'exports');
if (!fs.existsSync(exportsDir)) {
  fs.mkdirSync(exportsDir, { recursive: true });
}

// Get all exports (admin only)
export const getAllExports = async (req, res) => {
  try {
    console.log('Fetching all exports');
    console.log('User:', req.user);

    // Return empty array if no exports found to avoid errors
    try {
      const exports = await Export.find()
        .populate('user', 'fullName email');

      console.log(`Found ${exports.length} exports`);

      if (!exports || exports.length === 0) {
        console.log('No exports found, returning empty array');
        return res.status(200).json({
          success: true,
          count: 0,
          data: []
        });
      }

      // Manually populate content based on contentType
      const populatedExports = await Promise.all(exports.map(async (exportItem) => {
        console.log(`Processing export: ${exportItem._id}, type: ${exportItem.contentType}`);
        const exportObj = exportItem.toObject();

        try {
          // Handle report type exports differently
          if (exportObj.contentType === 'report') {
            console.log(`Export ${exportItem._id} is a report type`);
            // For report type, we don't need to populate content
            exportObj.content = {
              _id: null,
              title: `Rapport ${exportObj.reportType || 'inconnu'}`,
              description: `Rapport généré le ${new Date(exportObj.createdAt).toLocaleString('fr-FR')}`
            };
            return exportObj;
          }

          // For other content types, populate as before
          let contentModel;
          switch (exportObj.contentType) {
            case 'course':
              contentModel = Course;
              break;
            case 'test':
              contentModel = Test;
              break;
            case 'formation':
              contentModel = Formation;
              break;
            default:
              contentModel = null;
          }

          if (contentModel && exportObj.content) {
            try {
              const content = await contentModel.findById(exportObj.content);
              if (content) {
                exportObj.content = {
                  _id: content._id,
                  title: content.title,
                  description: content.description
                };
              } else {
                // Handle case where content doesn't exist
                console.log(`Content not found for export ${exportItem._id}`);
                exportObj.content = {
                  _id: exportObj.content,
                  title: 'Contenu non disponible',
                  description: 'Ce contenu n\'existe plus ou a été supprimé'
                };
              }
            } catch (contentError) {
              console.error(`Error finding content with ID ${exportObj.content}:`, contentError);
              // Provide fallback content object
              exportObj.content = {
                _id: exportObj.content,
                title: 'Erreur de chargement',
                description: 'Impossible de charger les détails du contenu'
              };
            }
          } else {
            // Handle case where content ID is missing
            console.log(`Content ID missing for export ${exportItem._id}`);
            exportObj.content = {
              _id: exportObj.content || 'unknown',
              title: 'Contenu non disponible',
              description: 'Informations de contenu manquantes'
            };
          }
        } catch (err) {
          console.error(`Error processing export ${exportItem._id}:`, err);
          // Don't let one bad export break the whole response
          exportObj.content = {
            title: 'Erreur',
            description: 'Erreur lors du chargement du contenu'
          };
        }

        return exportObj;
      }));

      console.log(`Successfully processed ${populatedExports.length} exports`);

      return res.status(200).json({
        success: true,
        count: populatedExports.length,
        data: populatedExports
      });
    } catch (dbError) {
      console.error('Database error in getAllExports:', dbError);
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
        message: 'Error fetching exports from database'
      });
    }
  } catch (error) {
    console.error('Error in getAllExports:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

// Get exports for a specific user
export const getUserExports = async (req, res) => {
  try {
    console.log('User ID:', req.user.id);

    // Return empty array if no exports found to avoid errors
    try {
      const exports = await Export.find({ user: req.user.id }).sort('-createdAt');

      console.log(`Found ${exports.length} exports for user ${req.user.id}`);

      if (!exports || exports.length === 0) {
        console.log('No exports found for user, returning empty array');
        return res.status(200).json({
          success: true,
          count: 0,
          data: []
        });
      }

      // Manually populate content based on contentType
      const populatedExports = await Promise.all(exports.map(async (exportItem) => {
        console.log(`Processing user export: ${exportItem._id}, type: ${exportItem.contentType}`);
        const exportObj = exportItem.toObject();

        try {
          // Handle report type exports differently
          if (exportObj.contentType === 'report') {
            console.log(`User export ${exportItem._id} is a report type`);
            // For report type, we don't need to populate content
            exportObj.content = {
              _id: null,
              title: `Rapport ${exportObj.reportType || 'inconnu'}`,
              description: `Rapport généré le ${new Date(exportObj.createdAt).toLocaleString('fr-FR')}`
            };
            return exportObj;
          }

          // For other content types, populate as before
          let contentModel;
          switch (exportObj.contentType) {
            case 'course':
              contentModel = Course;
              break;
            case 'test':
              contentModel = Test;
              break;
            case 'formation':
              contentModel = Formation;
              break;
            default:
              contentModel = null;
          }

          if (contentModel && exportObj.content) {
            try {
              const content = await contentModel.findById(exportObj.content);
              if (content) {
                exportObj.content = {
                  _id: content._id,
                  title: content.title,
                  description: content.description
                };
              } else {
                // Handle case where content doesn't exist
                console.log(`Content not found for user export ${exportItem._id}`);
                exportObj.content = {
                  _id: exportObj.content,
                  title: 'Contenu non disponible',
                  description: 'Ce contenu n\'existe plus ou a été supprimé'
                };
              }
            } catch (contentError) {
              console.error(`Error finding content with ID ${exportObj.content}:`, contentError);
              // Provide fallback content object
              exportObj.content = {
                _id: exportObj.content,
                title: 'Erreur de chargement',
                description: 'Impossible de charger les détails du contenu'
              };
            }
          } else {
            // Handle case where content ID is missing
            console.log(`Content ID missing for user export ${exportItem._id}`);
            exportObj.content = {
              _id: exportObj.content || 'unknown',
              title: 'Contenu non disponible',
              description: 'Informations de contenu manquantes'
            };
          }
        } catch (err) {
          console.error(`Error processing user export ${exportItem._id}:`, err);
          // Don't let one bad export break the whole response
          exportObj.content = {
            title: 'Erreur',
            description: 'Erreur lors du chargement du contenu'
          };
        }

        return exportObj;
      }));

      console.log(`Successfully processed ${populatedExports.length} user exports`);

      return res.status(200).json({
        success: true,
        count: populatedExports.length,
        data: populatedExports
      });
    } catch (dbError) {
      console.error('Database error in getUserExports:', dbError);
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
        message: 'Error fetching user exports from database'
      });
    }
  } catch (error) {
    console.error('Error in getUserExports:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

// Create a new export
export const createExport = async (req, res) => {
  try {
    const { contentType, contentId, format } = req.body;

    // Validate content exists
    let content;
    switch (contentType) {
      case 'course':
        content = await Course.findById(contentId);
        break;
      case 'test':
        content = await Test.findById(contentId);
        break;
      case 'formation':
        content = await Formation.findById(contentId);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Type de contenu invalide'
        });
    }

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Contenu non trouvé'
      });
    }

    // Create unique filename
    const timestamp = Date.now();
    const fileName = `${contentType}_${contentId}_${timestamp}.${format || 'pdf'}`;
    const filePath = join('uploads', 'exports', fileName);
    const fullPath = join(__dirname, '..', filePath);

    // Create export record
    const newExport = await Export.create({
      user: req.user.id,
      contentType,
      content: contentId,
      fileName,
      filePath,
      format: format || 'pdf',
      status: 'pending'
    });

    // Generate the export file asynchronously
    generateExportFile(newExport, content, fullPath)
      .then(async (fileSize) => {
        // Update export record with file size and status
        newExport.fileSize = fileSize;
        newExport.status = 'completed';
        await newExport.save();
      })
      .catch(async (error) => {
        console.error('Export generation error:', error);
        newExport.status = 'failed';
        await newExport.save();
      });

    res.status(201).json({
      success: true,
      data: newExport
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Generate a report export (admin only)
export const generateReport = async (req, res) => {
  try {
    const { reportType, format, dateRange, startDate, endDate } = req.body;

    // Validate request
    if (!reportType || !format) {
      return res.status(400).json({
        success: false,
        message: 'Type de rapport et format sont requis'
      });
    }

    // Validate format
    if (!['csv', 'xlsx', 'json', 'pdf'].includes(format)) {
      return res.status(400).json({
        success: false,
        message: 'Format non supporté'
      });
    }

    // Calculate date range
    let dateFilter = {};
    const now = new Date();

    if (dateRange === 'custom' && startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    } else if (dateRange === 'today') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      dateFilter = {
        createdAt: {
          $gte: today,
          $lte: now
        }
      };
    } else if (dateRange === 'yesterday') {
      const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      dateFilter = {
        createdAt: {
          $gte: yesterday,
          $lt: today
        }
      };
    } else if (dateRange === 'last7days') {
      const last7Days = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      dateFilter = {
        createdAt: {
          $gte: last7Days,
          $lte: now
        }
      };
    } else if (dateRange === 'last30days') {
      const last30Days = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
      dateFilter = {
        createdAt: {
          $gte: last30Days,
          $lte: now
        }
      };
    } else if (dateRange === 'thisMonth') {
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter = {
        createdAt: {
          $gte: firstDayOfMonth,
          $lte: now
        }
      };
    } else if (dateRange === 'lastMonth') {
      const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const firstDayOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter = {
        createdAt: {
          $gte: firstDayOfLastMonth,
          $lt: firstDayOfThisMonth
        }
      };
    }

    // Create unique filename
    const timestamp = Date.now();
    const fileName = `rapport_${reportType}_${timestamp}.${format}`;
    const filePath = join('uploads', 'exports', fileName);
    const fullPath = join(__dirname, '..', filePath);

    // Create export record
    const newExport = await Export.create({
      user: req.user.id,
      contentType: 'report',
      content: null,
      fileName,
      filePath,
      format,
      status: 'pending',
      reportType
    });

    // Generate the report file asynchronously
    generateReportFile(newExport, reportType, dateFilter, fullPath, format)
      .then(async (fileSize) => {
        // Update export record with file size and status
        newExport.fileSize = fileSize;
        newExport.status = 'completed';
        await newExport.save();
      })
      .catch(async (error) => {
        console.error('Report generation error:', error);
        newExport.status = 'failed';
        await newExport.save();
      });

    res.status(201).json({
      success: true,
      data: newExport,
      message: 'Génération du rapport en cours'
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Download an export
export const downloadExport = async (req, res) => {
  try {
    console.log(`Download request for export ID: ${req.params.id}`);
    const exportItem = await Export.findById(req.params.id);

    if (!exportItem) {
      console.log(`Export not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        message: 'Export non trouvé'
      });
    }

    console.log(`Found export: ${exportItem.fileName}, format: ${exportItem.format}, path: ${exportItem.filePath}`);

    // Check if user is authorized (admin or owner)
    if (req.user.role !== 'admin' && exportItem.user.toString() !== req.user.id) {
      console.log(`Unauthorized access attempt by user ${req.user.id} for export ${exportItem._id}`);
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à télécharger cet export'
      });
    }

    // Check if file exists
    const fullPath = join(__dirname, '..', exportItem.filePath);
    console.log(`Full path to file: ${fullPath}`);

    if (!fs.existsSync(fullPath)) {
      console.log(`File not found at path: ${fullPath}`);
      return res.status(404).json({
        success: false,
        message: 'Fichier d\'export non trouvé'
      });
    }

    // Get file stats
    const stats = fs.statSync(fullPath);
    console.log(`File size: ${stats.size} bytes`);

    if (stats.size === 0) {
      console.log(`File exists but is empty: ${fullPath}`);
      return res.status(500).json({
        success: false,
        message: 'Le fichier d\'export est vide'
      });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', getContentType(exportItem.format));
    res.setHeader('Content-Disposition', `attachment; filename="${exportItem.fileName}"`);
    res.setHeader('Content-Length', stats.size);

    // Create read stream and pipe to response
    console.log(`Sending file: ${exportItem.fileName}`);
    const fileStream = fs.createReadStream(fullPath);

    fileStream.on('error', (err) => {
      console.error(`Error streaming file: ${err.message}`);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Erreur lors de la lecture du fichier'
        });
      }
    });

    fileStream.pipe(res);
  } catch (error) {
    console.error(`Error in downloadExport: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Helper function to determine content type based on format
function getContentType(format) {
  switch (format.toLowerCase()) {
    case 'pdf':
      return 'application/pdf';
    case 'csv':
      return 'text/csv';
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'json':
      return 'application/json';
    case 'zip':
      return 'application/zip';
    default:
      return 'application/octet-stream';
  }
}

// Helper function to generate report files
const generateReportFile = async (exportItem, reportType, dateFilter, fullPath, format) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log(`Generating ${reportType} report in ${format} format`);

      // Get data based on report type
      let data = [];

      switch (reportType) {
        case 'users':
          data = await getUsersForReport(dateFilter);
          break;
        case 'courses':
          data = await getCoursesForReport(dateFilter);
          break;
        case 'sales':
          data = await getSalesForReport(dateFilter);
          break;
        case 'complaints':
          data = await getComplaintsForReport(dateFilter);
          break;
        default:
          reject(new Error(`Type de rapport non supporté: ${reportType}`));
          return;
      }

      if (!data || data.length === 0) {
        console.log(`No data found for ${reportType} report`);
        data = [{ message: 'Aucune donnée trouvée pour cette période' }];
      }

      // Generate file based on format
      switch (format) {
        case 'csv':
          await generateCSV(data, fullPath, reportType);
          break;
        case 'xlsx':
          await generateExcel(data, fullPath, reportType);
          break;
        case 'json':
          await generateJSON(data, fullPath);
          break;
        case 'pdf':
          await generatePDF(data, fullPath, reportType);
          break;
        default:
          reject(new Error(`Format non supporté: ${format}`));
          return;
      }

      // Get file size
      const stats = fs.statSync(fullPath);
      resolve(stats.size);
    } catch (error) {
      console.error('Error generating report file:', error);
      reject(error);
    }
  });
};

// Helper function to get users data for report
const getUsersForReport = async (dateFilter) => {
  try {
    const users = await User.find(dateFilter)
      .select('fullName email role createdAt lastLogin phone specialty bio enrollments')
      .sort('-createdAt');

    // Get enrollment counts for each user
    const userIds = users.map(user => user._id);
    const enrollmentCounts = await Enrollment.aggregate([
      { $match: { user: { $in: userIds } } },
      { $group: { _id: '$user', count: { $sum: 1 } } }
    ]);

    // Create a map of user ID to enrollment count
    const enrollmentCountMap = {};
    enrollmentCounts.forEach(item => {
      enrollmentCountMap[item._id] = item.count;
    });

    return users.map(user => {
      // Calculate user activity metrics
      const enrollmentCount = enrollmentCountMap[user._id] || 0;
      const daysSinceRegistration = user.createdAt ?
        Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24)) : 0;
      const daysSinceLastLogin = user.lastLogin ?
        Math.floor((new Date() - new Date(user.lastLogin)) / (1000 * 60 * 60 * 24)) : null;

      return {
        id: user._id,
        nom: user.fullName,
        email: user.email,
        role: user.role === 'student' ? 'Étudiant' :
              user.role === 'teacher' ? 'Enseignant' : 'Administrateur',
        téléphone: user.phone || 'Non renseigné',
        spécialité: user.specialty || 'Non renseignée',
        biographie: user.bio ? (user.bio.length > 50 ? user.bio.substring(0, 50) + '...' : user.bio) : 'Non renseignée',
        dateInscription: user.createdAt ? new Date(user.createdAt).toLocaleString('fr-FR') : 'N/A',
        dernièreConnexion: user.lastLogin ? new Date(user.lastLogin).toLocaleString('fr-FR') : 'Jamais',
        nombreInscriptions: enrollmentCount,
        jourDepuisInscription: daysSinceRegistration,
        jourDepuisDerniereConnexion: daysSinceLastLogin !== null ? daysSinceLastLogin : 'N/A',
        statutActivité: daysSinceLastLogin !== null ?
          (daysSinceLastLogin < 7 ? 'Actif' :
           daysSinceLastLogin < 30 ? 'Modéré' : 'Inactif') : 'Jamais connecté'
      };
    });
  } catch (error) {
    console.error('Error getting users for report:', error);
    return [];
  }
};

// Helper function to get courses data for report
const getCoursesForReport = async (dateFilter) => {
  try {
    const courses = await Course.find(dateFilter)
      .populate('teacher', 'fullName email')
      .select('title description price level category language createdAt views sections students ratings')
      .sort('-createdAt');

    // Get enrollment counts for each course
    const courseIds = courses.map(course => course._id);
    const enrollmentCounts = await Enrollment.aggregate([
      { $match: { course: { $in: courseIds }, itemType: 'course' } },
      { $group: { _id: '$course', count: { $sum: 1 } } }
    ]);

    // Create a map of course ID to enrollment count
    const enrollmentCountMap = {};
    enrollmentCounts.forEach(item => {
      enrollmentCountMap[item._id] = item.count;
    });

    return courses.map(course => {
      // Calculate course metrics
      const enrollmentCount = enrollmentCountMap[course._id] || 0;
      const daysSinceCreation = course.createdAt ?
        Math.floor((new Date() - new Date(course.createdAt)) / (1000 * 60 * 60 * 24)) : 0;

      // Calculate average rating
      let avgRating = 0;
      if (course.ratings && course.ratings.length > 0) {
        const sum = course.ratings.reduce((acc, rating) => acc + rating.value, 0);
        avgRating = (sum / course.ratings.length).toFixed(1);
      }

      // Calculate content metrics
      const sectionCount = course.sections ? course.sections.length : 0;
      let resourceCount = 0;
      if (course.sections) {
        course.sections.forEach(section => {
          if (section.resources) {
            resourceCount += section.resources.length;
          }
        });
      }

      return {
        id: course._id,
        titre: course.title,
        description: course.description ? course.description.substring(0, 100) + '...' : 'N/A',
        prix: course.price ? `${course.price} €` : 'Gratuit',
        niveau: course.level,
        catégorie: course.category,
        langue: course.language || 'Français',
        enseignant: course.teacher ? course.teacher.fullName : 'N/A',
        emailEnseignant: course.teacher ? course.teacher.email : 'N/A',
        dateCreation: course.createdAt ? new Date(course.createdAt).toLocaleString('fr-FR') : 'N/A',
        jourDepuisCreation: daysSinceCreation,
        vues: course.views || 0,
        nombreInscriptions: enrollmentCount,
        nombreSections: sectionCount,
        nombreRessources: resourceCount,
        nombreEvaluations: course.ratings ? course.ratings.length : 0,
        noteAverage: avgRating > 0 ? `${avgRating}/5` : 'Aucune évaluation',
        tauxConversion: course.views > 0 ? `${((enrollmentCount / course.views) * 100).toFixed(1)}%` : '0%',
        popularité: course.views > 100 ? 'Élevée' : (course.views > 50 ? 'Moyenne' : 'Faible')
      };
    });
  } catch (error) {
    console.error('Error getting courses for report:', error);
    return [];
  }
};

// Helper function to get sales data for report
const getSalesForReport = async (dateFilter) => {
  try {
    const enrollments = await Enrollment.find({
      ...dateFilter,
      paymentStatus: 'completed'
    })
      .populate('user', 'fullName email role')
      .populate({
        path: 'course',
        select: 'title price category level teacher',
        populate: { path: 'teacher', select: 'fullName' }
      })
      .populate({
        path: 'test',
        select: 'title price category difficulty teacher',
        populate: { path: 'teacher', select: 'fullName' }
      })
      .populate({
        path: 'formation',
        select: 'title price category level teacher',
        populate: { path: 'teacher', select: 'fullName' }
      })
      .sort('-createdAt');

    // Calculate total revenue
    let totalRevenue = 0;
    let revenueByCategory = {};
    let revenueByContentType = { 'Cours': 0, 'Test': 0, 'Formation': 0 };
    let salesByDay = {};

    // Get current date and format it
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split('T')[0];

    // Initialize sales by day for the last 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      salesByDay[dateStr] = { count: 0, revenue: 0 };
    }

    const formattedEnrollments = enrollments.map(enrollment => {
      let contentType = '';
      let contentTitle = '';
      let price = 0;
      let category = '';
      let level = '';
      let teacherName = '';

      if (enrollment.course) {
        contentType = 'Cours';
        contentTitle = enrollment.course.title;
        price = enrollment.course.price || 0;
        category = enrollment.course.category || 'Non catégorisé';
        level = enrollment.course.level || 'Non spécifié';
        teacherName = enrollment.course.teacher ? enrollment.course.teacher.fullName : 'N/A';
      } else if (enrollment.test) {
        contentType = 'Test';
        contentTitle = enrollment.test.title;
        price = enrollment.test.price || 0;
        category = enrollment.test.category || 'Non catégorisé';
        level = enrollment.test.difficulty || 'Non spécifié';
        teacherName = enrollment.test.teacher ? enrollment.test.teacher.fullName : 'N/A';
      } else if (enrollment.formation) {
        contentType = 'Formation';
        contentTitle = enrollment.formation.title;
        price = enrollment.formation.price || 0;
        category = enrollment.formation.category || 'Non catégorisé';
        level = enrollment.formation.level || 'Non spécifié';
        teacherName = enrollment.formation.teacher ? enrollment.formation.teacher.fullName : 'N/A';
      }

      // Update total revenue
      totalRevenue += price;

      // Update revenue by category
      if (!revenueByCategory[category]) {
        revenueByCategory[category] = 0;
      }
      revenueByCategory[category] += price;

      // Update revenue by content type
      revenueByContentType[contentType] += price;

      // Update sales by day
      if (enrollment.enrollmentDate) {
        const enrollmentDate = new Date(enrollment.enrollmentDate);
        const dateStr = enrollmentDate.toISOString().split('T')[0];
        if (salesByDay[dateStr]) {
          salesByDay[dateStr].count += 1;
          salesByDay[dateStr].revenue += price;
        }
      }

      // Calculate days since purchase
      const daysSincePurchase = enrollment.enrollmentDate ?
        Math.floor((new Date() - new Date(enrollment.enrollmentDate)) / (1000 * 60 * 60 * 24)) : 0;

      return {
        id: enrollment._id,
        étudiant: enrollment.user ? enrollment.user.fullName : 'N/A',
        email: enrollment.user ? enrollment.user.email : 'N/A',
        roleUtilisateur: enrollment.user ?
          (enrollment.user.role === 'student' ? 'Étudiant' :
           enrollment.user.role === 'teacher' ? 'Enseignant' : 'Administrateur') : 'N/A',
        typeContenu: contentType,
        titreContenu: contentTitle,
        catégorie: category,
        niveau: level,
        enseignant: teacherName,
        prix: `${price} €`,
        dateAchat: enrollment.enrollmentDate ? new Date(enrollment.enrollmentDate).toLocaleString('fr-FR') : 'N/A',
        jourDepuisAchat: daysSincePurchase,
        méthodePayment: enrollment.paymentMethod || 'N/A',
        transactionId: enrollment.transactionId || 'N/A',
        statut: enrollment.status || 'active',
        progression: enrollment.progress ? `${enrollment.progress}%` : '0%'
      };
    });

    // Add summary information at the beginning of the report
    const summaryData = {
      id: 'summary',
      étudiant: `RÉSUMÉ - ${formattedEnrollments.length} ventes`,
      email: `Revenu total: ${totalRevenue} €`,
      roleUtilisateur: '',
      typeContenu: `Cours: ${revenueByContentType['Cours']} €`,
      titreContenu: `Tests: ${revenueByContentType['Test']} €`,
      catégorie: `Formations: ${revenueByContentType['Formation']} €`,
      niveau: '',
      enseignant: '',
      prix: '',
      dateAchat: `Généré le: ${new Date().toLocaleString('fr-FR')}`,
      jourDepuisAchat: '',
      méthodePayment: '',
      transactionId: '',
      statut: '',
      progression: ''
    };

    // Add category breakdown
    const categoryBreakdown = Object.keys(revenueByCategory).map(category => {
      return {
        id: `category_${category}`,
        étudiant: '',
        email: '',
        roleUtilisateur: '',
        typeContenu: '',
        titreContenu: '',
        catégorie: `CATÉGORIE: ${category}`,
        niveau: '',
        enseignant: '',
        prix: `${revenueByCategory[category]} €`,
        dateAchat: `${((revenueByCategory[category] / totalRevenue) * 100).toFixed(1)}% du total`,
        jourDepuisAchat: '',
        méthodePayment: '',
        transactionId: '',
        statut: '',
        progression: ''
      };
    });

    // Return the data with summary at the beginning
    return [summaryData, ...categoryBreakdown, ...formattedEnrollments];
  } catch (error) {
    console.error('Error getting sales for report:', error);
    return [];
  }
};

// Helper function to get complaints data for report
const getComplaintsForReport = async (dateFilter) => {
  try {
    const complaints = await Complaint.find(dateFilter)
      .populate('user', 'fullName email role')
      .populate('assignedTo', 'fullName email')
      .populate({
        path: 'relatedItem.itemId',
        select: 'title'
      })
      .sort('-createdAt');

    // Calculate statistics
    const totalComplaints = complaints.length;
    const statusCounts = {
      'pending': 0,
      'in_progress': 0,
      'resolved': 0,
      'rejected': 0
    };

    const typeCounts = {
      'course': 0,
      'teacher': 0,
      'payment': 0,
      'technical': 0,
      'other': 0
    };

    const priorityCounts = {
      'low': 0,
      'medium': 0,
      'high': 0,
      'urgent': 0
    };

    let avgResolutionTime = 0;
    let resolvedCount = 0;

    complaints.forEach(complaint => {
      // Count by status
      if (complaint.status && statusCounts[complaint.status] !== undefined) {
        statusCounts[complaint.status]++;
      }

      // Count by type
      if (complaint.type && typeCounts[complaint.type] !== undefined) {
        typeCounts[complaint.type]++;
      }

      // Count by priority
      if (complaint.priority && priorityCounts[complaint.priority] !== undefined) {
        priorityCounts[complaint.priority]++;
      }

      // Calculate resolution time for resolved complaints
      if (complaint.status === 'resolved' && complaint.resolvedAt && complaint.createdAt) {
        const resolutionTime = new Date(complaint.resolvedAt) - new Date(complaint.createdAt);
        avgResolutionTime += resolutionTime;
        resolvedCount++;
      }
    });

    // Calculate average resolution time in hours
    if (resolvedCount > 0) {
      avgResolutionTime = Math.round(avgResolutionTime / resolvedCount / (1000 * 60 * 60));
    }

    const formattedComplaints = complaints.map(complaint => {
      // Get related item title if available
      let relatedItemTitle = 'N/A';
      if (complaint.relatedItem && complaint.relatedItem.itemId && complaint.relatedItem.itemId.title) {
        relatedItemTitle = complaint.relatedItem.itemId.title;
      }

      // Calculate resolution time for this complaint
      let resolutionTime = 'N/A';
      if (complaint.status === 'resolved' && complaint.resolvedAt && complaint.createdAt) {
        const timeDiff = new Date(complaint.resolvedAt) - new Date(complaint.createdAt);
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        if (days > 0) {
          resolutionTime = `${days} jour(s) et ${hours % 24} heure(s)`;
        } else {
          resolutionTime = `${hours} heure(s)`;
        }
      }

      // Format comments
      let lastComment = 'Aucun commentaire';
      if (complaint.comments && complaint.comments.length > 0) {
        const comment = complaint.comments[complaint.comments.length - 1];
        lastComment = `${comment.text.substring(0, 50)}${comment.text.length > 50 ? '...' : ''} (${new Date(comment.date).toLocaleString('fr-FR')})`;
      }

      return {
        id: complaint._id,
        sujet: complaint.subject,
        description: complaint.description ? complaint.description.substring(0, 100) + '...' : 'N/A',
        étudiant: complaint.user ? complaint.user.fullName : 'N/A',
        email: complaint.user ? complaint.user.email : 'N/A',
        roleUtilisateur: complaint.user ?
          (complaint.user.role === 'student' ? 'Étudiant' :
           complaint.user.role === 'teacher' ? 'Enseignant' : 'Administrateur') : 'N/A',
        type: complaint.type === 'course' ? 'Cours' :
              complaint.type === 'teacher' ? 'Enseignant' :
              complaint.type === 'payment' ? 'Paiement' :
              complaint.type === 'technical' ? 'Technique' : 'Autre',
        priorité: complaint.priority === 'low' ? 'Basse' :
                  complaint.priority === 'medium' ? 'Moyenne' :
                  complaint.priority === 'high' ? 'Haute' : 'Urgente',
        statut: complaint.status === 'pending' ? 'En attente' :
                complaint.status === 'in_progress' ? 'En cours' :
                complaint.status === 'resolved' ? 'Résolu' : 'Rejeté',
        contenuConcerné: relatedItemTitle,
        typeContenu: complaint.relatedItem ? complaint.relatedItem.itemType : 'N/A',
        assignéÀ: complaint.assignedTo ? complaint.assignedTo.fullName : 'Non assigné',
        dateCreation: complaint.createdAt ? new Date(complaint.createdAt).toLocaleString('fr-FR') : 'N/A',
        dateRésolution: complaint.resolvedAt ? new Date(complaint.resolvedAt).toLocaleString('fr-FR') : 'N/A',
        tempsRésolution: resolutionTime,
        nombreCommentaires: complaint.comments ? complaint.comments.length : 0,
        dernierCommentaire: lastComment,
        piècesJointes: complaint.attachments ? complaint.attachments.length : 0
      };
    });

    // Add summary information at the beginning of the report
    const summaryData = {
      id: 'summary',
      sujet: `RÉSUMÉ - ${totalComplaints} réclamations`,
      description: `Temps moyen de résolution: ${avgResolutionTime} heure(s)`,
      étudiant: '',
      email: '',
      roleUtilisateur: '',
      type: `Cours: ${typeCounts.course}, Enseignant: ${typeCounts.teacher}`,
      priorité: `Haute: ${priorityCounts.high}, Urgente: ${priorityCounts.urgent}`,
      statut: `En attente: ${statusCounts.pending}, En cours: ${statusCounts.in_progress}`,
      contenuConcerné: `Résolu: ${statusCounts.resolved}, Rejeté: ${statusCounts.rejected}`,
      typeContenu: '',
      assignéÀ: '',
      dateCreation: `Généré le: ${new Date().toLocaleString('fr-FR')}`,
      dateRésolution: '',
      tempsRésolution: '',
      nombreCommentaires: '',
      dernierCommentaire: '',
      piècesJointes: ''
    };

    // Return the data with summary at the beginning
    return [summaryData, ...formattedComplaints];
  } catch (error) {
    console.error('Error getting complaints for report:', error);
    return [];
  }
};

// Helper function to generate CSV file
const generateCSV = async (data, fullPath, reportType) => {
  return new Promise((resolve, reject) => {
    try {
      // Define fields based on report type
      let fields = [];

      if (data.length > 0) {
        fields = Object.keys(data[0]);
      }

      // Create CSV parser
      const json2csvParser = new Parser({ fields });
      const csv = json2csvParser.parse(data);

      // Write to file
      fs.writeFileSync(fullPath, csv);
      resolve();
    } catch (error) {
      console.error('Error generating CSV:', error);
      reject(error);
    }
  });
};

// Helper function to generate Excel file
const generateExcel = async (data, fullPath, reportType) => {
  return new Promise((resolve, reject) => {
    try {
      // Create a new workbook
      const workbook = new ExcelJS.Workbook();

      // Set workbook properties
      workbook.creator = 'WeLearn Platform';
      workbook.lastModifiedBy = 'WeLearn Platform';
      workbook.created = new Date();
      workbook.modified = new Date();

      // Add title based on report type
      let title = '';
      switch (reportType) {
        case 'users':
          title = 'Rapport des Utilisateurs';
          break;
        case 'courses':
          title = 'Rapport des Cours';
          break;
        case 'sales':
          title = 'Rapport des Ventes';
          break;
        case 'complaints':
          title = 'Rapport des Réclamations';
          break;
        default:
          title = 'Rapport';
      }

      workbook.title = title;
      workbook.subject = title;
      workbook.keywords = 'rapport, welearn, education';

      // Create worksheet
      const worksheet = workbook.addWorksheet(reportType, {
        pageSetup: {
          paperSize: 9, // A4
          orientation: 'landscape',
          fitToPage: true,
          fitToWidth: 1,
          fitToHeight: 0
        }
      });

      // Check if we have summary data (first item with id 'summary')
      let hasSummary = false;
      let summaryData = null;

      if (data.length > 0 && data[0].id === 'summary') {
        hasSummary = true;
        summaryData = data[0];

        // Create a summary section
        worksheet.mergeCells('A1:H1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = 'RÉSUMÉ DU RAPPORT';
        titleCell.font = {
          name: 'Arial',
          size: 16,
          bold: true,
          color: { argb: 'FFFFFFFF' }
        };
        titleCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4A90E2' }
        };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(1).height = 30;

        // Add summary data based on report type
        let summaryRow = 2;

        if (reportType === 'sales') {
          worksheet.mergeCells(`A${summaryRow}:H${summaryRow}`);
          worksheet.getCell(`A${summaryRow}`).value = summaryData.étudiant;
          worksheet.getCell(`A${summaryRow}`).font = { bold: true };
          summaryRow++;

          worksheet.mergeCells(`A${summaryRow}:H${summaryRow}`);
          worksheet.getCell(`A${summaryRow}`).value = summaryData.email;
          summaryRow++;

          worksheet.mergeCells(`A${summaryRow}:H${summaryRow}`);
          worksheet.getCell(`A${summaryRow}`).value = summaryData.typeContenu;
          summaryRow++;

          worksheet.mergeCells(`A${summaryRow}:H${summaryRow}`);
          worksheet.getCell(`A${summaryRow}`).value = summaryData.titreContenu;
          summaryRow++;

          worksheet.mergeCells(`A${summaryRow}:H${summaryRow}`);
          worksheet.getCell(`A${summaryRow}`).value = summaryData.catégorie;
          summaryRow++;
        } else if (reportType === 'complaints') {
          worksheet.mergeCells(`A${summaryRow}:H${summaryRow}`);
          worksheet.getCell(`A${summaryRow}`).value = summaryData.sujet;
          worksheet.getCell(`A${summaryRow}`).font = { bold: true };
          summaryRow++;

          worksheet.mergeCells(`A${summaryRow}:H${summaryRow}`);
          worksheet.getCell(`A${summaryRow}`).value = summaryData.description;
          summaryRow++;

          worksheet.mergeCells(`A${summaryRow}:H${summaryRow}`);
          worksheet.getCell(`A${summaryRow}`).value = summaryData.type;
          summaryRow++;

          worksheet.mergeCells(`A${summaryRow}:H${summaryRow}`);
          worksheet.getCell(`A${summaryRow}`).value = summaryData.priorité;
          summaryRow++;

          worksheet.mergeCells(`A${summaryRow}:H${summaryRow}`);
          worksheet.getCell(`A${summaryRow}`).value = summaryData.statut;
          summaryRow++;

          worksheet.mergeCells(`A${summaryRow}:H${summaryRow}`);
          worksheet.getCell(`A${summaryRow}`).value = summaryData.contenuConcerné;
          summaryRow++;
        } else {
          worksheet.mergeCells(`A${summaryRow}:H${summaryRow}`);
          worksheet.getCell(`A${summaryRow}`).value = `Nombre total d'éléments: ${data.length - 1}`;
          worksheet.getCell(`A${summaryRow}`).font = { bold: true };
          summaryRow++;
        }

        // Add generation date
        worksheet.mergeCells(`A${summaryRow}:H${summaryRow}`);
        worksheet.getCell(`A${summaryRow}`).value = `Généré le: ${new Date().toLocaleString('fr-FR')}`;
        summaryRow++;

        // Add empty row as separator
        summaryRow++;

        // Format summary section
        for (let i = 2; i < summaryRow; i++) {
          worksheet.getRow(i).height = 20;
          if (worksheet.getCell(`A${i}`).value) {
            worksheet.getCell(`A${i}`).alignment = { horizontal: 'left', vertical: 'middle' };
          }
        }

        // Remove summary from data for table display
        data = data.slice(1);

        // Add table title
        worksheet.mergeCells(`A${summaryRow}:H${summaryRow}`);
        const tableTitleCell = worksheet.getCell(`A${summaryRow}`);
        tableTitleCell.value = 'DONNÉES DÉTAILLÉES';
        tableTitleCell.font = {
          name: 'Arial',
          size: 14,
          bold: true,
          color: { argb: 'FF333333' }
        };
        tableTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(summaryRow).height = 25;

        summaryRow++;
      }

      // Add data table
      if (data.length > 0) {
        const headers = Object.keys(data[0]);

        // Determine starting row for data table
        const startRow = hasSummary ? worksheet.lastRow.number + 1 : 1;

        // Add headers
        const headerRow = worksheet.addRow(headers);

        // Format headers
        headerRow.font = { bold: true, color: { argb: 'FF333333' } };
        headerRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };
        headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
        headerRow.height = 20;

        // Add data rows
        data.forEach((item, index) => {
          const row = [];
          headers.forEach(header => {
            row.push(item[header] || '');
          });

          const dataRow = worksheet.addRow(row);

          // Add alternating row colors
          if (index % 2 === 0) {
            dataRow.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF9F9F9' }
            };
          }

          dataRow.alignment = { vertical: 'middle' };
          dataRow.height = 18;
        });

        // Auto-fit columns
        worksheet.columns.forEach(column => {
          let maxLength = 0;
          column.eachCell({ includeEmpty: true }, cell => {
            const columnLength = cell.value ? cell.value.toString().length : 10;
            if (columnLength > maxLength) {
              maxLength = columnLength;
            }
          });
          column.width = Math.min(maxLength + 2, 30);
        });

        // Add borders to all cells in the data table
        const endRow = worksheet.lastRow.number;
        const endCol = headers.length;

        for (let i = startRow; i <= endRow; i++) {
          for (let j = 1; j <= endCol; j++) {
            const cell = worksheet.getCell(i, j);
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
          }
        }

        // Freeze the header row
        worksheet.views = [
          { state: 'frozen', xSplit: 0, ySplit: startRow }
        ];
      }

      // Add footer
      const footerRow = worksheet.lastRow.number + 2;
      worksheet.mergeCells(`A${footerRow}:H${footerRow}`);
      const footerCell = worksheet.getCell(`A${footerRow}`);
      footerCell.value = 'WeLearn - Plateforme d\'apprentissage en ligne';
      footerCell.font = {
        name: 'Arial',
        size: 10,
        color: { argb: 'FF999999' }
      };
      footerCell.alignment = { horizontal: 'center' };

      // Write to file
      workbook.xlsx.writeFile(fullPath)
        .then(() => {
          resolve();
        })
        .catch(error => {
          console.error('Error writing Excel file:', error);
          reject(error);
        });
    } catch (error) {
      console.error('Error generating Excel:', error);
      reject(error);
    }
  });
};

// Helper function to generate JSON file
const generateJSON = async (data, fullPath) => {
  return new Promise((resolve, reject) => {
    try {
      // Write to file
      fs.writeFileSync(fullPath, JSON.stringify(data, null, 2));
      resolve();
    } catch (error) {
      console.error('Error generating JSON:', error);
      reject(error);
    }
  });
};

// Helper function to generate PDF file
const generatePDF = async (data, fullPath, reportType) => {
  return new Promise((resolve, reject) => {
    try {
      // Create a new PDF document
      const doc = new PDFDocument({
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        size: 'A4',
        info: {
          Title: `Rapport ${reportType}`,
          Author: 'WeLearn Platform',
          Subject: `Rapport ${reportType}`,
          Keywords: 'rapport, welearn, education'
        }
      });

      const stream = fs.createWriteStream(fullPath);

      // Handle errors on the stream
      stream.on('error', (err) => {
        console.error('Stream error:', err);
        reject(err);
      });

      doc.pipe(stream);

      // Add title and header
      let title = '';
      let subtitle = '';

      switch (reportType) {
        case 'users':
          title = 'Rapport des Utilisateurs';
          subtitle = 'Statistiques et informations détaillées sur les utilisateurs';
          break;
        case 'courses':
          title = 'Rapport des Cours';
          subtitle = 'Statistiques et informations détaillées sur les cours';
          break;
        case 'sales':
          title = 'Rapport des Ventes';
          subtitle = 'Statistiques et informations détaillées sur les ventes';
          break;
        case 'complaints':
          title = 'Rapport des Réclamations';
          subtitle = 'Statistiques et informations détaillées sur les réclamations';
          break;
        default:
          title = 'Rapport';
          subtitle = 'Informations détaillées';
      }

      // Add logo or header image (placeholder)
      // doc.image('path/to/logo.png', 50, 45, { width: 50 });

      // Add header with background color
      doc.fillColor('#4A90E2')
         .rect(50, 50, doc.page.width - 100, 60)
         .fill();

      doc.fillColor('white')
         .fontSize(24)
         .font('Helvetica-Bold')
         .text(title, 70, 65, { align: 'left' });

      doc.fontSize(12)
         .text(subtitle, 70, 95, { align: 'left' });

      // Add generation date and time
      doc.fillColor('black')
         .fontSize(10)
         .font('Helvetica')
         .text(`Généré le: ${new Date().toLocaleString('fr-FR')}`, 50, 130, { align: 'right' });

      // Add horizontal line
      doc.strokeColor('#CCCCCC')
         .lineWidth(1)
         .moveTo(50, 150)
         .lineTo(doc.page.width - 50, 150)
         .stroke();

      doc.moveDown(2);

      // Add summary section if available (first item in data array)
      if (data.length > 0 && data[0].id === 'summary') {
        const summaryData = data[0];

        doc.fillColor('#333333')
           .fontSize(14)
           .font('Helvetica-Bold')
           .text('Résumé', 50, 170);

        doc.moveDown(0.5);

        // Create a summary box
        doc.fillColor('#F5F5F5')
           .rect(50, doc.y, doc.page.width - 100, 80)
           .fill();

        doc.fillColor('#333333')
           .fontSize(11)
           .font('Helvetica')
           .text(summaryData.sujet, 60, doc.y + 10);

        doc.moveDown(0.5);

        // Add other summary fields based on report type
        if (reportType === 'users') {
          doc.text(`Nombre total d'utilisateurs: ${data.length - 1}`, 60);
        } else if (reportType === 'sales') {
          doc.text(summaryData.email, 60);
          doc.moveDown(0.5);
          doc.text(summaryData.typeContenu, 60);
          doc.moveDown(0.5);
          doc.text(summaryData.titreContenu, 60);
          doc.moveDown(0.5);
          doc.text(summaryData.catégorie, 60);
        } else if (reportType === 'complaints') {
          doc.text(summaryData.description, 60);
          doc.moveDown(0.5);
          doc.text(summaryData.type, 60);
          doc.moveDown(0.5);
          doc.text(summaryData.priorité, 60);
          doc.moveDown(0.5);
          doc.text(summaryData.statut, 60);
          doc.moveDown(0.5);
          doc.text(summaryData.contenuConcerné, 60);
        }

        doc.moveDown(2);

        // Remove summary from data for table display
        data = data.slice(1);
      }

      // Add data table
      if (data.length > 0) {
        // Add table title
        doc.fillColor('#333333')
           .fontSize(14)
           .font('Helvetica-Bold')
           .text('Données détaillées', 50, doc.y);

        doc.moveDown();

        // Add table headers
        const headers = Object.keys(data[0]);
        let yPos = doc.y;

        // Calculate column widths - limit to 5 columns per page for readability
        const pageWidth = doc.page.width - 100;
        const maxColumns = Math.min(5, headers.length);
        const colWidth = pageWidth / maxColumns;

        // Draw header background
        doc.fillColor('#E0E0E0')
           .rect(50, yPos, pageWidth, 20)
           .fill();

        // Draw headers - first set of columns
        for (let i = 0; i < maxColumns; i++) {
          if (i < headers.length) {
            doc.fillColor('#333333')
               .font('Helvetica-Bold')
               .fontSize(10)
               .text(headers[i], 55 + (i * colWidth), yPos + 5, { width: colWidth - 10, align: 'left' });
          }
        }

        yPos += 25;

        // Draw data rows - first set of columns
        data.forEach((row, rowIndex) => {
          // Add alternating row background
          if (rowIndex % 2 === 0) {
            doc.fillColor('#F9F9F9')
               .rect(50, yPos, pageWidth, 20)
               .fill();
          }

          // Check if we need a new page
          if (yPos > doc.page.height - 70) {
            doc.addPage();

            // Add header on new page
            yPos = 50;

            // Draw header background on new page
            doc.fillColor('#E0E0E0')
               .rect(50, yPos, pageWidth, 20)
               .fill();

            // Draw headers on new page
            for (let i = 0; i < maxColumns; i++) {
              if (i < headers.length) {
                doc.fillColor('#333333')
                   .font('Helvetica-Bold')
                   .fontSize(10)
                   .text(headers[i], 55 + (i * colWidth), yPos + 5, { width: colWidth - 10, align: 'left' });
              }
            }

            yPos += 25;
          }

          // Draw row
          for (let i = 0; i < maxColumns; i++) {
            if (i < headers.length) {
              const value = row[headers[i]] || '';
              doc.fillColor('#333333')
                 .font('Helvetica')
                 .fontSize(9)
                 .text(value.toString(), 55 + (i * colWidth), yPos + 5, {
                   width: colWidth - 10,
                   align: 'left',
                   ellipsis: true
                 });
            }
          }

          yPos += 20;
        });

        // If there are more columns, add them on new pages
        if (headers.length > maxColumns) {
          for (let colSet = 1; colSet < Math.ceil(headers.length / maxColumns); colSet++) {
            doc.addPage();

            // Add page title
            doc.fillColor('#333333')
               .fontSize(14)
               .font('Helvetica-Bold')
               .text(`Données détaillées (suite ${colSet})`, 50, 50);

            doc.moveDown();

            yPos = doc.y;

            // Draw header background
            doc.fillColor('#E0E0E0')
               .rect(50, yPos, pageWidth, 20)
               .fill();

            // Draw headers for this set of columns
            for (let i = 0; i < maxColumns; i++) {
              const headerIndex = colSet * maxColumns + i;
              if (headerIndex < headers.length) {
                doc.fillColor('#333333')
                   .font('Helvetica-Bold')
                   .fontSize(10)
                   .text(headers[headerIndex], 55 + (i * colWidth), yPos + 5, { width: colWidth - 10, align: 'left' });
              }
            }

            yPos += 25;

            // Draw data rows for this set of columns
            data.forEach((row, rowIndex) => {
              // Add alternating row background
              if (rowIndex % 2 === 0) {
                doc.fillColor('#F9F9F9')
                   .rect(50, yPos, pageWidth, 20)
                   .fill();
              }

              // Check if we need a new page
              if (yPos > doc.page.height - 70) {
                doc.addPage();

                // Add header on new page
                yPos = 50;

                // Draw header background on new page
                doc.fillColor('#E0E0E0')
                   .rect(50, yPos, pageWidth, 20)
                   .fill();

                // Draw headers on new page
                for (let i = 0; i < maxColumns; i++) {
                  const headerIndex = colSet * maxColumns + i;
                  if (headerIndex < headers.length) {
                    doc.fillColor('#333333')
                       .font('Helvetica-Bold')
                       .fontSize(10)
                       .text(headers[headerIndex], 55 + (i * colWidth), yPos + 5, { width: colWidth - 10, align: 'left' });
                  }
                }

                yPos += 25;
              }

              // Draw row
              for (let i = 0; i < maxColumns; i++) {
                const headerIndex = colSet * maxColumns + i;
                if (headerIndex < headers.length) {
                  const value = row[headers[headerIndex]] || '';
                  doc.fillColor('#333333')
                     .font('Helvetica')
                     .fontSize(9)
                     .text(value.toString(), 55 + (i * colWidth), yPos + 5, {
                       width: colWidth - 10,
                       align: 'left',
                       ellipsis: true
                     });
                }
              }

              yPos += 20;
            });
          }
        }
      } else {
        doc.fontSize(12)
           .text('Aucune donnée trouvée pour cette période', { align: 'center' });
      }

      // Add footer
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);

        // Add page number
        doc.fillColor('#999999')
           .fontSize(8)
           .text(
             `Page ${i + 1} sur ${pageCount}`,
             50,
             doc.page.height - 50,
             { align: 'center' }
           );

        // Add footer line
        doc.strokeColor('#CCCCCC')
           .lineWidth(1)
           .moveTo(50, doc.page.height - 60)
           .lineTo(doc.page.width - 50, doc.page.height - 60)
           .stroke();

        // Add footer text
        doc.fillColor('#999999')
           .fontSize(8)
           .text(
             'WeLearn - Plateforme d\'apprentissage en ligne',
             50,
             doc.page.height - 40,
             { align: 'center' }
           );
      }

      // End the document
      doc.end();

      stream.on('finish', () => {
        resolve();
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      reject(error);
    }
  });
};

// Helper function to generate export file
const generateExportFile = async (exportItem, content, fullPath) => {
  return new Promise((resolve, reject) => {
    try {
      if (exportItem.format === 'pdf') {
        // Generate PDF
        const doc = new PDFDocument();
        const stream = fs.createWriteStream(fullPath);

        // Handle errors on the stream
        stream.on('error', (err) => {
          console.error('Stream error:', err);
          reject(err);
        });

        doc.pipe(stream);

        try {
          // Add content to PDF
          doc.fontSize(25).text(content.title || 'Untitled', { align: 'center' });
          doc.moveDown();
          doc.fontSize(12).text(content.description || 'No description available');
          doc.moveDown();

          // Add more content based on content type
          if (exportItem.contentType === 'course' && content.sections && Array.isArray(content.sections)) {
            content.sections.forEach(section => {
              doc.fontSize(16).text(section.title || 'Untitled Section');
              doc.moveDown();
              doc.fontSize(12).text(section.content || 'No content available');
              doc.moveDown();
            });
          } else if (exportItem.contentType === 'test' && content.questions && Array.isArray(content.questions)) {
            content.questions.forEach((question, index) => {
              doc.fontSize(14).text(`Question ${index + 1}: ${question.text || 'No question text'}`);
              doc.moveDown();
              if (question.options && Array.isArray(question.options)) {
                question.options.forEach((option, optIndex) => {
                  doc.fontSize(12).text(`${String.fromCharCode(97 + optIndex)}) ${option.text || 'No option text'}`);
                });
              }
              doc.moveDown();
            });
          } else if (exportItem.contentType === 'formation' && content.modules && Array.isArray(content.modules)) {
            content.modules.forEach(module => {
              doc.fontSize(16).text(module.title || 'Untitled Module');
              doc.moveDown();
              doc.fontSize(12).text(module.description || 'No description available');
              doc.moveDown();
            });
          } else {
            // Fallback if content structure is not as expected
            doc.fontSize(14).text('Content details not available in the expected format.');
          }

          // Add export info
          doc.moveDown();
          doc.fontSize(10).text(`Exported on: ${new Date().toLocaleString()}`, { align: 'right' });

          // End the document
          doc.end();

          stream.on('finish', () => {
            try {
              const stats = fs.statSync(fullPath);
              resolve(stats.size);
            } catch (statError) {
              console.error('Error getting file stats:', statError);
              resolve(0); // Resolve with 0 size if stats fail
            }
          });
        } catch (docError) {
          console.error('PDF generation error:', docError);
          // Try to end the document and stream properly
          try {
            doc.end();
          } catch (endError) {
            console.error('Error ending PDF document:', endError);
          }
          reject(docError);
        }
      } else if (exportItem.format === 'zip') {
        // Generate ZIP
        const output = fs.createWriteStream(fullPath);
        const archive = archiver('zip', {
          zlib: { level: 9 }
        });

        output.on('error', (err) => {
          console.error('Output stream error:', err);
          reject(err);
        });

        output.on('close', () => {
          resolve(archive.pointer());
        });

        archive.on('error', (err) => {
          console.error('Archive error:', err);
          reject(err);
        });

        archive.pipe(output);

        try {
          // Add content to ZIP
          const contentJson = JSON.stringify(content, null, 2);
          archive.append(contentJson, { name: 'content.json' });

          // Add resources if available
          if (content.resources && Array.isArray(content.resources)) {
            content.resources.forEach(resource => {
              if (resource.file) {
                const resourcePath = join(__dirname, '..', resource.file);
                if (fs.existsSync(resourcePath)) {
                  archive.file(resourcePath, { name: `resources/${path.basename(resource.file)}` });
                }
              }
            });
          }

          archive.finalize();
        } catch (archiveError) {
          console.error('Error creating archive:', archiveError);
          reject(archiveError);
        }
      } else {
        reject(new Error('Format non supporté'));
      }
    } catch (error) {
      console.error('Unexpected error in generateExportFile:', error);
      reject(error);
    }
  });
};
