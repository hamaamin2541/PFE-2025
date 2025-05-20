
import mongoose from 'mongoose';
import  UserModel from '../models/User.js';
import Settings from '../models/Settings.js';
import bcrypt from 'bcryptjs'

const connectDB = async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}`);
        console.log('MongoDB connected successfully');
        // Check for admin account using environment variables or defaults
        const adminEmail = (process.env.ADMIN_EMAIL || "admin@welearn.com").toLowerCase().trim();
        let webmaster = await UserModel.findOne({ role: 'admin' });

        if (!webmaster) {
            console.log('No admin account found. Creating default admin account...');

            // Create default admin with credentials from environment variables
            let new_user = new UserModel({
                fullName: process.env.ADMIN_NAME || "Administrator",
                email: adminEmail,
                password: process.env.ADMIN_PASSWORD || 'Admin123!',
                phoneNumber: process.env.ADMIN_PHONE || "+216 00 000 000",
                role: 'admin',
                isVerified: true // Admin accounts are always verified by default
            });

            await new_user.save();
            console.log(`Admin account created successfully: ${new_user.email}`);
            console.log('IMPORTANT: Please change the default admin password after first login');
        } else {
            console.log(`Admin account already exists: ${webmaster.email}`);
        }

        // Initialize settings if they don't exist
        let settings = await Settings.findOne();
        if (!settings) {
            await Settings.create({});
            console.log('Default settings have been initialized');
        } else {
            console.log('Settings already exist in the database');
        }
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);

    }
}
export default connectDB