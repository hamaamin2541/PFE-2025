import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import path, { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import connectDB from './config/db.js';
import { errorHandler } from './utils/errorHandler.js'; // Import custom error handler

// Import routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import teacherAdviceRouter from './routes/teacherAdvice.js';
import messageRoutes from './routes/messageRoutes.js';
import testRoutes from './routes/testRoutes.js';
import formationRoutes from './routes/formationRoutes.js';
import enrollmentRoutes from './routes/enrollmentRoutes.js';
import ratingRoutes from './routes/ratingRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';
import contactMessageRoutes from './routes/contactMessageRoutes.js';
import teacherRatingRoutes from './routes/teacherRatingRoutes.js';
import testimonialRoutes from './routes/testimonialRoutes.js';

dotenv.config();

// Make sure you have JWT_SECRET in your environment variables
if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined.');
  process.exit(1);
}

connectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = join(__dirname, 'uploads', 'profiles');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create required directories if they don't exist
const publicImagesDir = join(__dirname, 'public/images');
const uploadsBaseDir = join(__dirname, 'uploads');
const uploadsVideosDir = join(__dirname, 'uploads/videos');
const uploadsProfilesDir = join(__dirname, 'uploads/profiles');
const uploadsComplaintsDir = join(__dirname, 'uploads/complaints');
const uploadsExportsDir = join(__dirname, 'uploads/exports');

[publicImagesDir, uploadsBaseDir, uploadsVideosDir, uploadsProfilesDir, uploadsComplaintsDir, uploadsExportsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], // Vite's default port
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));

// Serve static files
app.use('/uploads', express.static(join(__dirname, 'uploads')));
app.use('/images', express.static(join(__dirname, 'public/images')));

app.use(express.json());
app.use(morgan('dev'));

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/teacher-advice', teacherAdviceRouter);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/formations', formationRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/contact', contactMessageRoutes);
app.use('/api/teacher-ratings', teacherRatingRoutes);
app.use('/api/testimonials', testimonialRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error details:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

const PORT = process.env.PORT || 5001;



app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Créer un administrateur par défaut

});

// Error handling middleware
app.use(errorHandler); // Use the custom error handler
