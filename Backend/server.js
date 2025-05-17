import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import path, { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import http from 'http';
import { Server } from 'socket.io';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables first, before any other imports
// Explicitly specify the path to the .env file
const envPath = join(__dirname, '.env');
console.log('Looking for .env file at:', envPath);
if (fs.existsSync(envPath)) {
  console.log('.env file exists');
} else {
  console.log('.env file does NOT exist at this location');
}

const result = dotenv.config({ path: envPath });
console.log('Dotenv config result:', result.error ? `Error loading .env file: ${result.error.message}` : '.env file loaded successfully');

// Check if OPENAI_API_KEY is loaded
if (process.env.OPENAI_API_KEY) {
  const keyPreview = process.env.OPENAI_API_KEY.substring(0, 5) + '...';
  console.log(`OPENAI_API_KEY is loaded (starts with ${keyPreview}, length: ${process.env.OPENAI_API_KEY.length})`);
} else {
  console.log('OPENAI_API_KEY is NOT loaded');
}

console.log('Environment variables loaded:', Object.keys(process.env).filter(key => !key.includes('SECRET') && !key.includes('KEY')).join(', '));

import connectDB from './config/db.js';
import { errorHandler } from './utils/errorHandler.js'; // Import custom error handler
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
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
import exportRoutes from './routes/exportRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import certificateRoutes from './routes/certificateRoutes.js';
import studySessionRoutes from './routes/studySessionRoutes.js';
import gamificationRoutes from './routes/gamificationRoutes.js';
import studyTimeRoutes from './routes/studyTimeRoutes.js';
import courseQuestionRoutes from './routes/courseQuestionRoutes.js';
import assistantRoutes from './routes/assistantRoutes.js';

// Make sure you have JWT_SECRET in your environment variables
if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined.');
  process.exit(1);
}

connectDB();

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
const uploadsCertificatesDir = join(__dirname, 'uploads/certificates');

[publicImagesDir, uploadsBaseDir, uploadsVideosDir, uploadsProfilesDir, uploadsComplaintsDir, uploadsExportsDir, uploadsCertificatesDir].forEach(dir => {
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
app.use('/api/exports', exportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/study-sessions', studySessionRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/study-time', studyTimeRoutes);
app.use('/api/course-questions', courseQuestionRoutes);
app.use('/api/assistants', assistantRoutes);
app.post('/create-checkout-session', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: 'Produit de test' },
          unit_amount: 1000,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: 'http://localhost:5173/success',
      cancel_url:  'http://localhost:5173/cancel',
    });
    res.json({ id: session.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Impossible de créer la session' });
  }
});

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

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Join a study session room
  socket.on('join-study-session', (sessionId) => {
    socket.join(`study-session-${sessionId}`);
    console.log(`User ${socket.id} joined study session ${sessionId}`);
  });

  // Handle video player events
  socket.on('video-play', (data) => {
    socket.to(`study-session-${data.sessionId}`).emit('video-play', data);
  });

  socket.on('video-pause', (data) => {
    socket.to(`study-session-${data.sessionId}`).emit('video-pause', data);
  });

  socket.on('video-seek', (data) => {
    socket.to(`study-session-${data.sessionId}`).emit('video-seek', data);
  });

  // Handle chat messages
  socket.on('send-message', (data) => {
    io.to(`study-session-${data.sessionId}`).emit('receive-message', data);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Error handling middleware
app.use(errorHandler); // Use the custom error handler
