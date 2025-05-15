import Export from '../models/Export.js';
import Course from '../models/Course.js';
import Test from '../models/Test.js';
import Formation from '../models/Formation.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import PDFDocument from 'pdfkit';
import archiver from 'archiver';

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
    const exports = await Export.find()
      .populate('user', 'fullName email');

    // Manually populate content based on contentType
    const populatedExports = await Promise.all(exports.map(async (exportItem) => {
      const exportObj = exportItem.toObject();

      try {
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

        if (contentModel) {
          const content = await contentModel.findById(exportObj.content);
          if (content) {
            exportObj.content = {
              _id: content._id,
              title: content.title,
              description: content.description
            };
          }
        }
      } catch (err) {
        console.error('Error populating content:', err);
      }

      return exportObj;
    }));

    res.status(200).json({
      success: true,
      count: populatedExports.length,
      data: populatedExports
    });
  } catch (error) {
    console.error('Error in getAllExports:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get exports for a specific user
export const getUserExports = async (req, res) => {
  try {
    console.log('User ID:', req.user.id);
    const exports = await Export.find({ user: req.user.id }).sort('-createdAt');

    // Manually populate content based on contentType
    const populatedExports = await Promise.all(exports.map(async (exportItem) => {
      const exportObj = exportItem.toObject();

      try {
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

        if (contentModel) {
          const content = await contentModel.findById(exportObj.content);
          if (content) {
            exportObj.content = {
              _id: content._id,
              title: content.title,
              description: content.description
            };
          }
        }
      } catch (err) {
        console.error('Error populating content:', err);
      }

      return exportObj;
    }));

    res.status(200).json({
      success: true,
      count: populatedExports.length,
      data: populatedExports
    });
  } catch (error) {
    console.error('Error in getUserExports:', error);
    res.status(500).json({
      success: false,
      message: error.message
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

// Download an export
export const downloadExport = async (req, res) => {
  try {
    const exportItem = await Export.findById(req.params.id);

    if (!exportItem) {
      return res.status(404).json({
        success: false,
        message: 'Export non trouvé'
      });
    }

    // Check if user is authorized (admin or owner)
    if (req.user.role !== 'admin' && exportItem.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à télécharger cet export'
      });
    }

    // Check if file exists
    const fullPath = join(__dirname, '..', exportItem.filePath);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({
        success: false,
        message: 'Fichier d\'export non trouvé'
      });
    }

    // Send file
    res.download(fullPath, exportItem.fileName);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
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
