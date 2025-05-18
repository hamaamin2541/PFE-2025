import mongoose from 'mongoose';
import dotenv from 'dotenv';
import colors from 'colors';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

// Function to fix the specific admin account
const fixAdminAccount = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected'.cyan.underline);

    // Find the specific admin account
    const adminEmail = 'admin@welearn.com';
    const admin = await User.findOne({ email: adminEmail });
    
    if (!admin) {
      console.log(`Admin account with email ${adminEmail} not found`.red);
      mongoose.disconnect();
      process.exit(1);
      return;
    }

    console.log('Found admin account:'.cyan);
    console.log(`Email: ${admin.email}`.yellow);
    console.log(`Name: ${admin.fullName}`.yellow);
    console.log(`ID: ${admin._id}`.yellow);
    console.log(`Current verification status: ${admin.isVerified ? 'Verified' : 'Not Verified'}`.yellow);
    
    // Update the admin account
    admin.isVerified = true;
    admin.verificationCode = undefined;
    admin.verificationExpires = undefined;
    
    await admin.save();
    
    console.log('Admin account updated successfully:'.green);
    console.log(`Email: ${admin.email}`.green);
    console.log(`Verification status: ${admin.isVerified ? 'Verified' : 'Not Verified'}`.green);
    
    mongoose.disconnect();
    console.log('Database connection closed'.cyan);
    process.exit(0);
  } catch (error) {
    console.error('Error fixing admin account:'.red.bold);
    console.error(error);
    process.exit(1);
  }
};

// Run the function
fixAdminAccount();
