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
      .select('fullName email role createdAt lastLogin')
      .sort('-createdAt');

    return users.map(user => ({
      id: user._id,
      nom: user.fullName,
      email: user.email,
      role: user.role === 'student' ? 'Étudiant' :
            user.role === 'teacher' ? 'Enseignant' : 'Administrateur',
      dateInscription: user.createdAt ? new Date(user.createdAt).toLocaleString('fr-FR') : 'N/A',
      dernièreConnexion: user.lastLogin ? new Date(user.lastLogin).toLocaleString('fr-FR') : 'Jamais'
    }));
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
      .select('title description price level category createdAt views')
      .sort('-createdAt');

    return courses.map(course => ({
      id: course._id,
      titre: course.title,
      description: course.description ? course.description.substring(0, 100) + '...' : 'N/A',
      prix: course.price ? `${course.price} €` : 'Gratuit',
      niveau: course.level,
      catégorie: course.category,
      enseignant: course.teacher ? course.teacher.fullName : 'N/A',
      emailEnseignant: course.teacher ? course.teacher.email : 'N/A',
      dateCreation: course.createdAt ? new Date(course.createdAt).toLocaleString('fr-FR') : 'N/A',
      vues: course.views || 0
    }));
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
      .populate('user', 'fullName email')
      .populate('course', 'title price')
      .populate('test', 'title price')
      .populate('formation', 'title price')
      .sort('-createdAt');

    return enrollments.map(enrollment => {
      let contentType = '';
      let contentTitle = '';
      let price = 0;

      if (enrollment.course) {
        contentType = 'Cours';
        contentTitle = enrollment.course.title;
        price = enrollment.course.price || 0;
      } else if (enrollment.test) {
        contentType = 'Test';
        contentTitle = enrollment.test.title;
        price = enrollment.test.price || 0;
      } else if (enrollment.formation) {
        contentType = 'Formation';
        contentTitle = enrollment.formation.title;
        price = enrollment.formation.price || 0;
      }

      return {
        id: enrollment._id,
        étudiant: enrollment.user ? enrollment.user.fullName : 'N/A',
        email: enrollment.user ? enrollment.user.email : 'N/A',
        typeContenu: contentType,
        titreContenu: contentTitle,
        prix: `${price} €`,
        dateAchat: enrollment.createdAt ? new Date(enrollment.createdAt).toLocaleString('fr-FR') : 'N/A',
        méthodePayment: enrollment.paymentMethod || 'N/A',
        transactionId: enrollment.transactionId || 'N/A'
      };
    });
  } catch (error) {
    console.error('Error getting sales for report:', error);
    return [];
  }
};

// Helper function to get complaints data for report
const getComplaintsForReport = async (dateFilter) => {
  try {
    const complaints = await Complaint.find(dateFilter)
      .populate('user', 'fullName email')
      .sort('-createdAt');

    return complaints.map(complaint => ({
      id: complaint._id,
      sujet: complaint.subject,
      description: complaint.description ? complaint.description.substring(0, 100) + '...' : 'N/A',
      étudiant: complaint.user ? complaint.user.fullName : 'N/A',
      email: complaint.user ? complaint.user.email : 'N/A',
      statut: complaint.status === 'pending' ? 'En attente' :
              complaint.status === 'in-progress' ? 'En cours' : 'Résolu',
      dateCreation: complaint.createdAt ? new Date(complaint.createdAt).toLocaleString('fr-FR') : 'N/A',
      dateRésolution: complaint.resolvedAt ? new Date(complaint.resolvedAt).toLocaleString('fr-FR') : 'N/A',
      commentaires: complaint.comments ? complaint.comments.length : 0
    }));
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
      const worksheet = workbook.addWorksheet(reportType);

      // Add headers
      if (data.length > 0) {
        const headers = Object.keys(data[0]);
        worksheet.addRow(headers);

        // Add data
        data.forEach(item => {
          const row = [];
          headers.forEach(header => {
            row.push(item[header]);
          });
          worksheet.addRow(row);
        });

        // Format headers
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };
      }

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
      const doc = new PDFDocument();
      const stream = fs.createWriteStream(fullPath);

      // Handle errors on the stream
      stream.on('error', (err) => {
        console.error('Stream error:', err);
        reject(err);
      });

      doc.pipe(stream);

      // Add title
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

      doc.fontSize(25).text(title, { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Généré le: ${new Date().toLocaleString('fr-FR')}`, { align: 'right' });
      doc.moveDown();

      // Add data
      if (data.length > 0) {
        // Add table headers
        const headers = Object.keys(data[0]);
        let yPos = doc.y;

        // Calculate column widths
        const pageWidth = doc.page.width - 100;
        const colWidth = pageWidth / headers.length;

        // Draw headers
        headers.forEach((header, i) => {
          doc.font('Helvetica-Bold')
             .fontSize(10)
             .text(header, 50 + (i * colWidth), yPos, { width: colWidth, align: 'left' });
        });

        doc.moveDown();
        yPos = doc.y;

        // Draw data rows
        data.forEach((row, rowIndex) => {
          // Check if we need a new page
          if (yPos > doc.page.height - 100) {
            doc.addPage();
            yPos = 50;
          }

          // Draw row
          headers.forEach((header, i) => {
            doc.font('Helvetica')
               .fontSize(9)
               .text(row[header] || '', 50 + (i * colWidth), yPos, { width: colWidth, align: 'left' });
          });

          yPos += 20;
          doc.y = yPos;
        });
      } else {
        doc.fontSize(12).text('Aucune donnée trouvée pour cette période', { align: 'center' });
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
