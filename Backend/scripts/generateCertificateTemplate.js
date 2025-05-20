import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create directory for templates if it doesn't exist
const templatesDir = join(__dirname, '..', 'uploads', 'templates');
if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir, { recursive: true });
  console.log('Created templates directory:', templatesDir);
}

// Create a unique filename
const filename = 'certificate_template.pdf';
const filePath = join(templatesDir, filename);

// Create a new PDF document
const doc = new PDFDocument({
  size: 'A4',
  layout: 'landscape',
  margins: { top: 50, bottom: 50, left: 50, right: 50 },
  info: {
    Title: 'Certificate Template',
    Author: 'WeLearn Platform',
    Subject: 'Certificate Template',
    Keywords: 'certificate, template, welearn'
  }
});

// Pipe the PDF to a file
const stream = fs.createWriteStream(filePath);
doc.pipe(stream);

// Set page background color
doc.rect(0, 0, doc.page.width, doc.page.height).fill('#FAFAFA');

// Add a sleek border with rounded corners
doc.roundedRect(15, 15, doc.page.width - 30, doc.page.height - 30, 10)
   .lineWidth(3)
   .stroke('#000000');

// Add a second inner border with different color
doc.roundedRect(25, 25, doc.page.width - 50, doc.page.height - 50, 8)
   .lineWidth(1)
   .stroke('#333333');

// Add decorative elements - modern geometric shapes
// Top left decorative element
doc.circle(50, 50, 15)
   .fill('#000000');

// Top right decorative element
doc.circle(doc.page.width - 50, 50, 15)
   .fill('#000000');

// Bottom left decorative element
doc.circle(50, doc.page.height - 50, 15)
   .fill('#000000');

// Bottom right decorative element
doc.circle(doc.page.width - 50, doc.page.height - 50, 15)
   .fill('#000000');

// Add a header with modern styling
doc.fontSize(40)
   .font('Helvetica-Bold')
   .fillColor('#000000')
   .text('CERTIFICAT DE RÉUSSITE', {
     align: 'center',
     y: 80
   });

// Add decorative line under title - thinner and more elegant
doc.moveTo(doc.page.width / 2 - 180, 130)
   .lineTo(doc.page.width / 2 + 180, 130)
   .lineWidth(1.5)
   .stroke('#000000');

// Add certificate text
doc.fontSize(20)
   .font('Helvetica')
   .fillColor('#333333')
   .text('Ce certificat est décerné à', {
     align: 'center',
     y: 170
   });

// Add student name placeholder
doc.fontSize(38)
   .font('Helvetica-Bold')
   .fillColor('#000000')
   .text('[NOM DE L\'ÉTUDIANT]', {
     align: 'center',
     y: 210
   });

// Add decorative line under name - subtle
doc.moveTo(doc.page.width / 2 - 150, 260)
   .lineTo(doc.page.width / 2 + 150, 260)
   .lineWidth(0.75)
   .stroke('#555555');

// Add course completion text
doc.fontSize(20)
   .font('Helvetica')
   .fillColor('#333333')
   .text('pour avoir complété avec succès', {
     align: 'center',
     y: 280
   });

// Add course title placeholder
doc.fontSize(30)
   .font('Helvetica-Bold')
   .fillColor('#000000')
   .text('[TITRE DU COURS]', {
     align: 'center',
     y: 320
   });

// Add date placeholder
doc.fontSize(16)
   .font('Helvetica')
   .fillColor('#333333')
   .text('Délivré le [DATE]', {
     align: 'center',
     y: 370
   });

// Add a modern official seal
doc.circle(150, doc.page.height - 120, 40)
   .lineWidth(2)
   .fillAndStroke('#FAFAFA', '#000000');

doc.circle(150, doc.page.height - 120, 35)
   .lineWidth(1)
   .stroke('#333333');

doc.fontSize(12)
   .font('Helvetica-Bold')
   .fillColor('#000000')
   .text('OFFICIEL', 150, doc.page.height - 125, {
     width: 60,
     align: 'center'
   });

// Add signature line - cleaner and more minimal
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

// Add WeLearn logo or platform name
doc.fontSize(16)
   .font('Helvetica-Bold')
   .fillColor('#000000')
   .text('WeLearn', 100, doc.page.height - 90, {
     width: 100,
     align: 'center'
   });

// Add QR code placeholder
doc.rect(doc.page.width / 2 - 50, doc.page.height - 170, 100, 100)
   .lineWidth(1)
   .stroke('#333333');

doc.fontSize(10)
   .font('Helvetica')
   .fillColor('#333333')
   .text('QR CODE', doc.page.width / 2 - 50, doc.page.height - 170 + 45, {
     width: 100,
     align: 'center'
   });

// Add certificate ID placeholder
doc.fontSize(10)
   .font('Helvetica')
   .fillColor('#333333')
   .text('ID du certificat: [ID]', {
     align: 'center',
     y: doc.page.height - 40
   });

// Add verification URL placeholder
doc.fontSize(8)
   .font('Helvetica')
   .fillColor('#333333')
   .text('Vérifiez l\'authenticité: [URL]', {
     align: 'center',
     y: doc.page.height - 25
   });

// Finalize the PDF
doc.end();

// When the stream is finished, log success
stream.on('finish', () => {
  console.log('Certificate template generated successfully at:', filePath);
  
  // Also create a PNG version for easier use
  console.log('Note: For a PNG version, you can convert the PDF using a tool like ImageMagick or a PDF to PNG converter.');
});

// Handle stream errors
stream.on('error', (err) => {
  console.error('Stream error:', err);
});
