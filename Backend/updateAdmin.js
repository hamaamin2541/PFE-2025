import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB Connected');
    
    try {
      // Find the admin account
      const admin = await User.findOne({ email: 'admin@welearn.com' });
      
      if (!admin) {
        console.log('Admin account not found');
        mongoose.disconnect();
        return;
      }
      
      console.log('Found admin account:');
      console.log(`Email: ${admin.email}`);
      console.log(`Name: ${admin.fullName}`);
      console.log(`Verification status: ${admin.isVerified ? 'Verified' : 'Not Verified'}`);
      
      // Update the admin account
      admin.isVerified = true;
      admin.verificationCode = undefined;
      admin.verificationExpires = undefined;
      
      await admin.save();
      
      console.log('Admin account updated successfully');
      console.log(`New verification status: ${admin.isVerified ? 'Verified' : 'Not Verified'}`);
    } catch (error) {
      console.error('Error updating admin account:', error);
    } finally {
      mongoose.disconnect();
      console.log('Database connection closed');
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });
