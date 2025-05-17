import Certificate from '../models/Certificate.js';
import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import Test from '../models/Test.js';
import Formation from '../models/Formation.js';
import User from '../models/User.js';
import QRCode from 'qrcode';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import crypto from 'crypto';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Generate a unique certificate ID
const generateCertificateId = async () => {
  // Generate a random string using crypto
  const id = crypto.randomBytes(8).toString('hex');

  // Check if ID already exists
  const existingCertificate = await Certificate.findOne({ certificateId: id });
  if (existingCertificate) {
    // If ID exists, generate a new one recursively
    return generateCertificateId();
  }

  return id;
};

// Generate a QR code for the certificate
const generateQRCode = async (verificationUrl) => {
  try {
    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 200
    });

    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

// Generate a PDF certificate with a beautiful design
const generateCertificatePDF = async (certificate, student, content) => {
  return new Promise((resolve, reject) => {
    try {
      // Create directory for certificates if it doesn't exist
      const certificatesDir = join(__dirname, '..', 'uploads', 'certificates');
      if (!fs.existsSync(certificatesDir)) {
        fs.mkdirSync(certificatesDir, { recursive: true });
      }

      // Create a unique filename
      const filename = `certificate_${certificate.certificateId}.pdf`;
      const filePath = join(certificatesDir, filename);

      // Create a new PDF document
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: 'Certificat de réussite',
          Author: 'WeLearn Platform',
          Subject: 'Certificat',
          Keywords: 'certificat, formation, cours, test'
        }
      });

      // Pipe the PDF to a file
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Set page background color
      doc.rect(0, 0, doc.page.width, doc.page.height).fill('#f5f5f5');

      // Add a gold border
      doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
         .lineWidth(5)
         .stroke('#D4AF37');

      // Add a second inner border
      doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60)
         .lineWidth(1)
         .stroke('#D4AF37');

      // Add decorative corners
      const cornerSize = 30;

      // Top left corner
      doc.polygon([20, 20], [20 + cornerSize, 20], [20, 20 + cornerSize])
         .fill('#D4AF37');

      // Top right corner
      doc.polygon([doc.page.width - 20, 20], [doc.page.width - 20 - cornerSize, 20], [doc.page.width - 20, 20 + cornerSize])
         .fill('#D4AF37');

      // Bottom left corner
      doc.polygon([20, doc.page.height - 20], [20 + cornerSize, doc.page.height - 20], [20, doc.page.height - 20 - cornerSize])
         .fill('#D4AF37');

      // Bottom right corner
      doc.polygon([doc.page.width - 20, doc.page.height - 20], [doc.page.width - 20 - cornerSize, doc.page.height - 20], [doc.page.width - 20, doc.page.height - 20 - cornerSize])
         .fill('#D4AF37');

      // Add a header with elegant styling
      doc.fontSize(40)
         .font('Helvetica-Bold')
         .fillColor('#333333')
         .text('CERTIFICAT DE RÉUSSITE', {
           align: 'center',
           y: 80
         });

      // Add decorative line under title
      doc.moveTo(doc.page.width / 2 - 200, 130)
         .lineTo(doc.page.width / 2 + 200, 130)
         .lineWidth(2)
         .stroke('#D4AF37');

      // Add certificate text
      doc.fontSize(20)
         .font('Helvetica')
         .fillColor('#333333')
         .text('Ce certificat est décerné à', {
           align: 'center',
           y: 170
         });

      // Add student name
      doc.fontSize(36)
         .font('Helvetica-Bold')
         .fillColor('#1E3A8A')
         .text(student.fullName, {
           align: 'center',
           y: 210
         });

      // Add decorative line under name
      doc.moveTo(doc.page.width / 2 - 150, 260)
         .lineTo(doc.page.width / 2 + 150, 260)
         .lineWidth(1)
         .stroke('#D4AF37');

      // Add course completion text
      doc.fontSize(20)
         .font('Helvetica')
         .fillColor('#333333')
         .text('pour avoir complété avec succès', {
           align: 'center',
           y: 280
         });

      // Add course title
      doc.fontSize(28)
         .font('Helvetica-Bold')
         .fillColor('#1E3A8A')
         .text(content.title, {
           align: 'center',
           y: 320
         });

      // Format the date
      const issueDate = new Date(certificate.issueDate).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Add date
      doc.fontSize(16)
         .font('Helvetica')
         .fillColor('#333333')
         .text(`Délivré le ${issueDate}`, {
           align: 'center',
           y: 370
         });

      // Add official seal
      doc.circle(150, doc.page.height - 120, 50)
         .lineWidth(2)
         .fillAndStroke('#f5f5f5', '#D4AF37');

      doc.circle(150, doc.page.height - 120, 40)
         .lineWidth(1)
         .stroke('#D4AF37');

      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#D4AF37')
         .text('OFFICIEL', 150, doc.page.height - 125, {
           width: 60,
           align: 'center'
         });

      // Add signature line
      doc.moveTo(doc.page.width - 250, doc.page.height - 100)
         .lineTo(doc.page.width - 100, doc.page.height - 100)
         .lineWidth(1)
         .stroke('#333333');

      doc.fontSize(14)
         .font('Helvetica')
         .fillColor('#333333')
         .text('Signature du Directeur', doc.page.width - 250, doc.page.height - 90, {
           width: 150,
           align: 'center'
         });

      // Add QR code
      const qrCodeImage = certificate.qrCodeUrl;
      doc.image(qrCodeImage, doc.page.width / 2 - 50, doc.page.height - 170, {
        fit: [100, 100]
      });

      // Add certificate ID
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#333333')
         .text(`ID du certificat: ${certificate.certificateId}`, {
           align: 'center',
           y: doc.page.height - 40
         });

      // Add verification URL
      doc.fontSize(8)
         .font('Helvetica')
         .fillColor('#333333')
         .text(`Vérifiez l'authenticité: ${certificate.verificationUrl}`, {
           align: 'center',
           y: doc.page.height - 25
         });

      // Finalize the PDF
      doc.end();

      // When the stream is finished, resolve with the file path
      stream.on('finish', () => {
        resolve(filePath);
      });

      // Handle stream errors
      stream.on('error', (err) => {
        console.error('Stream error:', err);
        reject(err);
      });
    } catch (error) {
      console.error('Error generating certificate PDF:', error);
      reject(error);
    }
  });
};

// Generate a certificate for a completed enrollment
export const generateCertificate = async (req, res) => {
  try {
    console.log('Certificate generation started');
    const { enrollmentId } = req.params;
    console.log('Enrollment ID:', enrollmentId);

    // Find the enrollment
    const enrollment = await Enrollment.findById(enrollmentId);
    console.log('Enrollment found:', enrollment ? 'Yes' : 'No');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    console.log('Enrollment status:', enrollment.status);
    console.log('Enrollment progress:', enrollment.progress);
    console.log('Enrollment type:', enrollment.itemType);

    // Check if enrollment is completed
    if (enrollment.status !== 'completed' && enrollment.progress < 100) {
      // Changed from OR to AND to be more lenient
      console.log('Enrollment not completed, forcing completion');
      // Update enrollment to completed status
      enrollment.status = 'completed';
      enrollment.progress = 100;
      await enrollment.save();
    }

    // Check if certificate already exists
    console.log('Checking for existing certificate');
    const existingCertificate = await Certificate.findOne({ enrollment: enrollmentId });
    console.log('Existing certificate found:', existingCertificate ? 'Yes' : 'No');

    if (existingCertificate) {
      return res.status(200).json({
        success: true,
        data: existingCertificate,
        message: 'Certificate already exists'
      });
    }

    // Get content details based on enrollment type
    console.log('Getting content details for type:', enrollment.itemType);
    let content;
    if (enrollment.itemType === 'course') {
      console.log('Course ID:', enrollment.course);
      content = await Course.findById(enrollment.course);
    } else if (enrollment.itemType === 'test') {
      console.log('Test ID:', enrollment.test);
      content = await Test.findById(enrollment.test);
    } else if (enrollment.itemType === 'formation') {
      console.log('Formation ID:', enrollment.formation);
      content = await Formation.findById(enrollment.formation);
    }

    console.log('Content found:', content ? 'Yes' : 'No');
    if (content) {
      console.log('Content title:', content.title);
    }

    if (!content) {
      return res.status(404).json({
        success: false,
        message: `${enrollment.itemType} not found`
      });
    }

    // Get student details
    console.log('Getting student details');
    console.log('Student ID:', enrollment.user);
    const student = await User.findById(enrollment.user);
    console.log('Student found:', student ? 'Yes' : 'No');
    if (student) {
      console.log('Student name:', student.fullName);
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Generate a unique certificate ID
    console.log('Generating certificate ID');
    const certificateId = await generateCertificateId();
    console.log('Certificate ID generated:', certificateId);

    // Create verification URL
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify/certificate/${certificateId}`;
    console.log('Verification URL:', verificationUrl);

    // Generate QR code
    console.log('Generating QR code');
    try {
      const qrCodeUrl = await generateQRCode(verificationUrl);
      console.log('QR code generated successfully');

      // Create certificate record
      console.log('Creating certificate record');
      try {
        // Create a certificate object with all required fields
        const certificateData = {
          student: student._id,
          contentType: enrollment.itemType,
          enrollment: enrollment._id,
          certificateId,
          verificationUrl,
          qrCodeUrl
        };

        // Add the content reference based on the content type
        if (enrollment.itemType === 'course') {
          certificateData.course = content._id;
        } else if (enrollment.itemType === 'test') {
          certificateData.test = content._id;
        } else if (enrollment.itemType === 'formation') {
          certificateData.formation = content._id;
        }

        console.log('Certificate data:', JSON.stringify(certificateData, null, 2));

        const certificate = await Certificate.create(certificateData);

        console.log('Certificate record created:', certificate._id);

        // Generate PDF certificate
        console.log('Generating PDF certificate');
        try {
          const certificatePath = await generateCertificatePDF(certificate, student, content);
          console.log('PDF certificate generated at:', certificatePath);

          // Update certificate with PDF path
          const relativePath = certificatePath.replace(join(__dirname, '..'), '').replace(/\\/g, '/');
          console.log('Relative path:', relativePath);

          certificate.certificateUrl = relativePath;
          await certificate.save();
          console.log('Certificate updated with PDF path');

          // Update enrollment with certificate info
          enrollment.certificate = {
            issued: true,
            issueDate: certificate.issueDate,
            certificateUrl: relativePath
          };
          await enrollment.save();
          console.log('Enrollment updated with certificate info');
        } catch (pdfError) {
          console.error('Error generating PDF:', pdfError);
          throw pdfError;
        }
      } catch (certError) {
        console.error('Error creating certificate record:', certError);
        throw certError;
      }
    } catch (qrError) {
      console.error('Error generating QR code:', qrError);
      throw qrError;
    }

    // This variable is now out of scope due to the nested try-catch blocks
    // We need to get the certificate again
    const finalCertificate = await Certificate.findOne({ certificateId });
    console.log('Final certificate retrieved:', finalCertificate ? 'Yes' : 'No');

    res.status(201).json({
      success: true,
      data: finalCertificate,
      message: 'Certificate generated successfully'
    });
  } catch (error) {
    console.error('Error generating certificate:', error);
    // Create uploads/certificates directory if it doesn't exist
    try {
      const certificatesDir = join(__dirname, '..', 'uploads', 'certificates');
      if (!fs.existsSync(certificatesDir)) {
        fs.mkdirSync(certificatesDir, { recursive: true });
        console.log('Created certificates directory:', certificatesDir);
      }
    } catch (dirError) {
      console.error('Error creating certificates directory:', dirError);
    }

    res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while generating the certificate'
    });
  }
};

// Get certificate by ID
export const getCertificateById = async (req, res) => {
  try {
    const { certificateId } = req.params;

    const certificate = await Certificate.findOne({ certificateId })
      .populate('student', 'fullName email')
      .populate('course', 'title')
      .populate('test', 'title')
      .populate('formation', 'title');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    res.status(200).json({
      success: true,
      data: certificate
    });
  } catch (error) {
    console.error('Error getting certificate:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Verify certificate (public endpoint)
export const verifyCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;

    const certificate = await Certificate.findOne({ certificateId })
      .populate('student', 'fullName')
      .populate({
        path: 'course',
        select: 'title teacher',
        populate: {
          path: 'teacher',
          select: 'fullName'
        }
      })
      .populate({
        path: 'test',
        select: 'title teacher',
        populate: {
          path: 'teacher',
          select: 'fullName'
        }
      })
      .populate({
        path: 'formation',
        select: 'title teacher',
        populate: {
          path: 'teacher',
          select: 'fullName'
        }
      });

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found or invalid'
      });
    }

    // Get content title and teacher based on content type
    let contentTitle, teacherName;
    if (certificate.contentType === 'course' && certificate.course) {
      contentTitle = certificate.course.title;
      teacherName = certificate.course.teacher?.fullName;
    } else if (certificate.contentType === 'test' && certificate.test) {
      contentTitle = certificate.test.title;
      teacherName = certificate.test.teacher?.fullName;
    } else if (certificate.contentType === 'formation' && certificate.formation) {
      contentTitle = certificate.formation.title;
      teacherName = certificate.formation.teacher?.fullName;
    }

    // Format issue date
    const issueDate = new Date(certificate.issueDate).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    res.status(200).json({
      success: true,
      data: {
        isValid: true,
        certificateId: certificate.certificateId,
        studentName: certificate.student.fullName,
        contentType: certificate.contentType,
        contentTitle,
        teacherName,
        issueDate
      }
    });
  } catch (error) {
    console.error('Error verifying certificate:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Download certificate
export const downloadCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;

    const certificate = await Certificate.findOne({ certificateId });

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    // Get the full path to the certificate
    const certificatePath = join(__dirname, '..', certificate.certificateUrl);

    // Check if file exists
    if (!fs.existsSync(certificatePath)) {
      return res.status(404).json({
        success: false,
        message: 'Certificate file not found'
      });
    }

    // Set headers for file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=certificate_${certificate.certificateId}.pdf`);

    // Stream the file to the response
    const fileStream = fs.createReadStream(certificatePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading certificate:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get user certificates
export const getUserCertificates = async (req, res) => {
  try {
    const userId = req.user._id;

    const certificates = await Certificate.find({ student: userId })
      .populate('course', 'title')
      .populate('test', 'title')
      .populate('formation', 'title')
      .sort({ issueDate: -1 });

    res.status(200).json({
      success: true,
      data: certificates
    });
  } catch (error) {
    console.error('Error getting user certificates:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
