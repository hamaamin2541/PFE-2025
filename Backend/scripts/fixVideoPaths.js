import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import TeacherAdvice model
import TeacherAdvice from '../models/TeacherAdvice.js';

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Define paths
const uploadsDir = join(__dirname, '..', 'uploads');
const videosDir = join(__dirname, '..', 'uploads', 'videos');

// Ensure videos directory exists
if (!fs.existsSync(videosDir)) {
  fs.mkdirSync(videosDir, { recursive: true });
  console.log('Created videos directory at:', videosDir);
}

const fixVideoPaths = async () => {
  try {
    // Get all video advice
    const videoAdvice = await TeacherAdvice.find({ type: 'video' });
    console.log(`Found ${videoAdvice.length} video advice entries`);

    // Process each video advice
    for (const advice of videoAdvice) {
      if (!advice.videoPath) {
        console.log(`Advice ${advice._id} has no video path, skipping`);
        continue;
      }

      // Extract filename from path
      const filename = advice.videoPath.split('/').pop();
      
      // Check if file exists in root uploads directory
      const oldPath = join(uploadsDir, filename);
      const newPath = join(videosDir, filename);
      
      console.log(`Processing ${advice._id}:`);
      console.log(`  Current path: ${advice.videoPath}`);
      console.log(`  Old file path: ${oldPath}`);
      console.log(`  New file path: ${newPath}`);
      
      // Move file if it exists in the old location
      if (fs.existsSync(oldPath)) {
        console.log(`  Moving file from ${oldPath} to ${newPath}`);
        fs.copyFileSync(oldPath, newPath);
        fs.unlinkSync(oldPath);
      } else {
        console.log(`  File not found at ${oldPath}`);
      }
      
      // Update the path in the database
      const newDbPath = `/uploads/videos/${filename}`;
      console.log(`  Updating database path to: ${newDbPath}`);
      
      await TeacherAdvice.updateOne(
        { _id: advice._id },
        { $set: { videoPath: newDbPath } }
      );
      
      console.log(`  Updated advice ${advice._id}`);
    }
    
    console.log('Video paths fixed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing video paths:', error);
    process.exit(1);
  }
};

// Run the function
fixVideoPaths();
