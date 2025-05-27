import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Course from '../models/Course.js';
import Formation from '../models/Formation.js';
import Test from '../models/Test.js';
import Enrollment from '../models/Enrollment.js';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Download a document from a course, formation, or test
export const downloadDocument = async (req, res) => {
  try {
    const { contentType, contentId, resourceId } = req.params;

    // Validate content type
    if (!['course', 'formation', 'test'].includes(contentType)) {
      return res.status(400).json({
        success: false,
        message: 'Type de contenu invalide'
      });
    }

    // Find the content based on content type
    let content;
    switch (contentType) {
      case 'course':
        content = await Course.findById(contentId);
        break;
      case 'formation':
        content = await Formation.findById(contentId);
        break;
      case 'test':
        content = await Test.findById(contentId);
        break;
    }

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Contenu non trouvé'
      });
    }

    // Check if the user is enrolled in the content or is the teacher who created the content
    // First, check if the user is the teacher who created this content
    let isContentCreator = false;
    if (req.user.role === 'teacher' || req.user.role === 'admin') {
      // Check if the teacher is the creator of the content
      if (content.teacher && content.teacher.toString() === req.user._id.toString()) {
        isContentCreator = true;
      }
    }

    // If not the content creator, check for enrollment (for all users including teachers)
    if (!isContentCreator) {
      const enrollment = await Enrollment.findOne({
        user: req.user._id,
        $or: [
          { course: contentId, itemType: 'course' },
          { formation: contentId, itemType: 'formation' },
          { test: contentId, itemType: 'test' }
        ]
      });

      if (!enrollment) {
        return res.status(403).json({
          success: false,
          message: 'Vous n\'êtes pas inscrit à ce contenu'
        });
      }
    }

    // Find the resource based on content type
    let resource;
    if (contentType === 'course') {
      // For courses, resources are in sections
      for (const section of content.sections) {
        const foundResource = section.resources.find(r => r._id.toString() === resourceId);
        if (foundResource) {
          resource = foundResource;
          break;
        }
      }
    } else if (contentType === 'formation') {
      // For formations, resources are in modules
      for (const module of content.modules) {
        const foundResource = module.resources.find(r => r._id.toString() === resourceId);
        if (foundResource) {
          resource = foundResource;
          break;
        }
      }
    } else if (contentType === 'test') {
      // For tests, resources are directly in the test
      resource = content.resources.find(r => r._id.toString() === resourceId);
    }

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Ressource non trouvée'
      });
    }

    // Get the file path
    const filePath = resource.file;
    const fullPath = join(__dirname, '..', filePath);

    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({
        success: false,
        message: 'Fichier non trouvé'
      });
    }

    // Get file stats
    const stats = fs.statSync(fullPath);

    // Set appropriate headers based on file type
    const contentTypeMap = {
      'pdf': 'application/pdf',
      'document': 'application/octet-stream',
      'video': 'video/mp4',
      'image': 'image/jpeg',
      'audio': 'audio/mpeg',
      'other': 'application/octet-stream'
    };

    // Extract filename from path
    const filename = path.basename(filePath);

    // Set headers for file download
    res.setHeader('Content-Type', contentTypeMap[resource.type] || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', stats.size);

    // Stream the file to the response
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
    console.error('Error downloading document:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Une erreur est survenue lors du téléchargement du document'
    });
  }
};

// Download a document directly by filename (simpler approach)
export const downloadDocumentByFilename = async (req, res) => {
  try {
    const { filename } = req.params;

    // Sanitize filename to prevent directory traversal attacks
    const sanitizedFilename = path.basename(filename);

    // Construct the path to the file
    const resourcesPath = join(__dirname, '..', 'uploads', 'courses', 'resources');
    const fullPath = join(resourcesPath, sanitizedFilename);

    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({
        success: false,
        message: 'Fichier non trouvé'
      });
    }

    // Get file stats
    const stats = fs.statSync(fullPath);

    // Determine content type based on file extension
    const ext = path.extname(sanitizedFilename).toLowerCase();
    let contentType = 'application/octet-stream';

    switch (ext) {
      case '.pdf':
        contentType = 'application/pdf';
        break;
      case '.doc':
      case '.docx':
        contentType = 'application/msword';
        break;
      case '.ppt':
      case '.pptx':
        contentType = 'application/vnd.ms-powerpoint';
        break;
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.mp4':
        contentType = 'video/mp4';
        break;
      case '.mp3':
        contentType = 'audio/mpeg';
        break;
    }

    // Set headers for file download
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${sanitizedFilename}"`);
    res.setHeader('Content-Length', stats.size);

    // Stream the file to the response
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
    console.error('Error downloading document by filename:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Une erreur est survenue lors du téléchargement du document'
    });
  }
};
