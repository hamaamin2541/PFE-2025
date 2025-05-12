import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';

// Ensure upload directories exist
const coversPath = 'uploads/courses/covers';
const resourcesPath = 'uploads/courses/resources';
fs.ensureDirSync(coversPath);
fs.ensureDirSync(resourcesPath);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath;
    // Select upload path based on file type
    if (file.fieldname === 'coverImage') {
      uploadPath = coversPath;
    } else {
      uploadPath = resourcesPath;
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    'image/jpeg': true,
    'image/png': true,
    'image/gif': true,
    'image/webp': true,  // Add WebP support
    'video/mp4': true,
    'video/webm': true,
    'application/pdf': true,
    'application/msword': true,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': true,
    'application/vnd.ms-powerpoint': true,
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': true
  };

  if (allowedTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed. Allowed types are: ${Object.keys(allowedTypes).join(', ')}`), false);
  }
};

const limits = {
  fileSize: 50 * 1024 * 1024, // 50MB max file size
  files: 10 // Maximum number of files
};

export const upload = multer({
  storage,
  fileFilter,
  limits
});
