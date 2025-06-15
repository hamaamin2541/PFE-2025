// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import path, { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import http from 'http';
import { Server } from 'socket.io';
import Stripe from 'stripe';
import bodyParser from 'body-parser';
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
import  cours from "./models/Course.js"
import enrollement from "./models/Enrollment.js"
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes

// Controllers
import { enroll } from './controllers/enrollmentController.js';

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
import assistantHelpRoutes from './routes/assistantHelpRoutes.js';
import postRoutes from './routes/postRoutes.js';
import recommendationRoutes from './routes/recommendationRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import { protect } from './middleware/authMiddleware.js';

// Utilities
import connectDB from './config/db.js';
import { errorHandler } from './utils/errorHandler.js';

// __dirname setup
const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// Load environment
dotenv.config({ path: join(__dirname, '.env') });

// Connect to DB
connectDB();

// Stripe setup
const stripe       = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Ensure upload dirs
[
  'uploads',
  'uploads/profiles',
  'uploads/videos',
  'uploads/complaints',
  'uploads/exports',
  'uploads/certificates'
].forEach(dir => {
  const full = join(__dirname, dir);
  if (!fs.existsSync(full)) fs.mkdirSync(full, { recursive: true });
});

const app = express();

// CORS
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:5173'];
app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(morgan('dev'));

// Serve static
app.use('/uploads', express.static(join(__dirname, 'uploads')));
app.use('/images' , express.static(join(__dirname, 'public/images')));
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes

// Stripe Webhook (raw body)
app.post(
  '/webhook',
  bodyParser.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error('⚠️ Webhook signature failed.', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { itemId, itemType, userId } = session.metadata;

      // Simulate req/res for enroll()
      const fakeReq = { user: { _id: userId }, body: { itemId, itemType } };
      const fakeRes = {
        status: code => ({ json: obj => console.log('[ENROLL]', code, obj) })
      };

      try {
        await enroll(fakeReq, fakeRes);
        console.log(`✅ User ${userId} enrolled in ${itemType} ${itemId}`);
      } catch (e) {
        console.error('❌ Enrollment error:', e);
      }
    }

    res.json({ received: true });
  }
);

// Body parser
app.use(express.json());

// Mount routes
app.use('/api/auth'            , authRoutes);
app.use('/api/users'           , userRoutes);
app.use('/api/courses'         , courseRoutes);
app.use('/api/teacher-advice'  , teacherAdviceRouter);
app.use('/api/messages'        , messageRoutes);
app.use('/api/tests'           , testRoutes);
app.use('/api/formations'      , formationRoutes);
app.use('/api/enrollments'     , enrollmentRoutes);
app.use('/api/ratings'         , ratingRoutes);
app.use('/api/admin'           , adminRoutes);
app.use('/api/complaints'      , complaintRoutes);
app.use('/api/contact'         , contactMessageRoutes);
app.use('/api/teacher-ratings' , teacherRatingRoutes);
app.use('/api/testimonials'    , testimonialRoutes);
app.use('/api/exports'         , exportRoutes);
app.use('/api/settings'        , settingsRoutes);
app.use('/api/ai'              , aiRoutes);
app.use('/api/certificates'    , certificateRoutes);
app.use('/api/study-sessions'  , studySessionRoutes);
app.use('/api/gamification'    , gamificationRoutes);
app.use('/api/study-time'      , studyTimeRoutes);
app.use('/api/course-questions', courseQuestionRoutes);
app.use('/api/assistants'      , assistantRoutes);
app.use('/api/assistant'       , assistantHelpRoutes);
app.use('/api/posts'           , postRoutes);
app.use('/api/recommendations' , recommendationRoutes);
app.use('/api/documents'       , documentRoutes);

// Create checkout session
app.post(
  '/create-checkout-session',
<<<<<<< Updated upstream
<<<<<<< Updated upstream
  protect,
  async (req, res) => {
    const { itemId, itemType, amount } = req.body;
    console.log(itemId, itemType, amount);
    const userId = req.user._id.toString();
  console.log("userid",userId);
  
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'eur',
            product_data: { name: `Achat ${itemType}` },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url : `http://localhost:5173/cancel`,
        metadata: { itemId, itemType, userId }
      });

       const existe_enroulement=await enrollement.findOne({user:userId})
       if (existe_enroulement){
  if (itemType=='course'){

        
       await enrollement.findByIdAndUpdate({_id:existe_enroulement._id},{$addToSet:{course:itemId}},{new:true})
     }
 if(itemType=='formation'){
       await enrollement.findByIdAndUpdate({_id:existe_enroulement._id},{$addToSet:{formation:itemId}},{new:true})

 }
     if (itemType== "test") {
       await enrollement.findByIdAndUpdate({_id:existe_enroulement._id},{$addToSet:{test:itemId}},{new:true})
      
        }
       }else{
         const payload = {
      user: userId,
      itemType,
      paymentStatus: 'completed',
      amount,
    };

    switch (itemType) {
      case 'course':
        payload.course = [itemId];
        payload.formation = [];
        payload.test = [];
        break;

      case 'formation':
        payload.course = [];
        payload.formation = [itemId];
        payload.test = [];
        break;

      case 'test':
        payload.course = [];
        payload.formation = [];
        payload.test = [itemId];
        break;

    }

    const new_enrollment = new enrollement(payload);
    await new_enrollment.save();
       }
    

    

      res.json({ id: session.id });
    } catch (err) {
      console.error('Stripe session error:', err);
      res.status(500).json({ error: 'Impossible de créer la session' });
    }
  }
);




=======

// Stripe Webhook (raw body)
app.post(
  '/webhook',
  bodyParser.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error('⚠️ Webhook signature failed.', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { itemId, itemType, userId } = session.metadata;

      // Simulate req/res for enroll()
      const fakeReq = { user: { _id: userId }, body: { itemId, itemType } };
      const fakeRes = {
        status: code => ({ json: obj => console.log('[ENROLL]', code, obj) })
      };

      try {
        await enroll(fakeReq, fakeRes);
        console.log(`✅ User ${userId} enrolled in ${itemType} ${itemId}`);
      } catch (e) {
        console.error('❌ Enrollment error:', e);
      }
    }

    res.json({ received: true });
  }
);

// Body parser
app.use(express.json());

// Mount routes
app.use('/api/auth'            , authRoutes);
app.use('/api/users'           , userRoutes);
app.use('/api/courses'         , courseRoutes);
app.use('/api/teacher-advice'  , teacherAdviceRouter);
app.use('/api/messages'        , messageRoutes);
app.use('/api/tests'           , testRoutes);
app.use('/api/formations'      , formationRoutes);
app.use('/api/enrollments'     , enrollmentRoutes);
app.use('/api/ratings'         , ratingRoutes);
app.use('/api/admin'           , adminRoutes);
app.use('/api/complaints'      , complaintRoutes);
app.use('/api/contact'         , contactMessageRoutes);
app.use('/api/teacher-ratings' , teacherRatingRoutes);
app.use('/api/testimonials'    , testimonialRoutes);
app.use('/api/exports'         , exportRoutes);
app.use('/api/settings'        , settingsRoutes);
app.use('/api/ai'              , aiRoutes);
app.use('/api/certificates'    , certificateRoutes);
app.use('/api/study-sessions'  , studySessionRoutes);
app.use('/api/gamification'    , gamificationRoutes);
app.use('/api/study-time'      , studyTimeRoutes);
app.use('/api/course-questions', courseQuestionRoutes);
app.use('/api/assistants'      , assistantRoutes);
app.use('/api/assistant'       , assistantHelpRoutes);
app.use('/api/posts'           , postRoutes);
app.use('/api/recommendations' , recommendationRoutes);
app.use('/api/documents'       , documentRoutes);

// Create checkout session
app.post(
  '/create-checkout-session',
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
  async (req, res) => {
    const { itemId, itemType, amount } = req.body;
    const userId = req.user._id.toString();

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'eur',
            product_data: { name: `Achat ${itemType}` },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url : `http://localhost:5173/cancel`,
        metadata: { itemId, itemType, userId }
      });
      res.json({ id: session.id });
    } catch (err) {
      console.error('Stripe session error:', err);
      res.status(500).json({ error: 'Impossible de créer la session' });
    }
  }
);
<<<<<<< Updated upstream
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes

const PORT = process.env.PORT || 5001;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io with the same CORS origins as the Express app
const io = new Server(server, {
  cors: {
    origin: corsOrigins,
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

  // Join community wall room
  socket.on('join-community-wall', () => {
    socket.join('community-wall');
    console.log(`User ${socket.id} joined community wall`);
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

  // Handle community wall events
  socket.on('new-post', (data) => {
    io.to('community-wall').emit('post-created', data);
  });

  socket.on('new-comment', (data) => {
    io.to('community-wall').emit('comment-added', data);
  });

  socket.on('new-reaction', (data) => {
    io.to('community-wall').emit('reaction-added', data);
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

