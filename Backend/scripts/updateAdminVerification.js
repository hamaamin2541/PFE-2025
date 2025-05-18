import mongoose from 'mongoose';
import dotenv from 'dotenv';
import colors from 'colors';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

// Function to update admin verification status
const updateAdminVerification = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected'.cyan.underline);

    // Find all admin users
    const adminUsers = await User.find({ role: 'admin' });
    
    if (adminUsers.length === 0) {
      console.log('No admin users found in the database'.yellow);
      mongoose.disconnect();
      process.exit(0);
      return;
    }

    console.log(`Found ${adminUsers.length} admin user(s)`.cyan);
    
    // Update each admin user to set isVerified to true
    let updatedCount = 0;
    
    for (const admin of adminUsers) {
      if (!admin.isVerified) {
        admin.isVerified = true;
        await admin.save();
        updatedCount++;
        console.log(`Updated admin: ${admin.email}`.green);
      } else {
        console.log(`Admin already verified: ${admin.email}`.yellow);
      }
    }
    
    console.log(`${updatedCount} admin account(s) updated to verified status`.green);
    
    mongoose.disconnect();
    console.log('Database connection closed'.cyan);
    process.exit(0);
  } catch (error) {
    console.error('Error updating admin verification:'.red.bold);
    console.error(error);
    process.exit(1);
  }
};

// Run the function
updateAdminVerification();
