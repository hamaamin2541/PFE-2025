
import mongoose from 'mongoose';
import  UserModel from '../models/User.js';
import Settings from '../models/Settings.js';
import bcrypt from 'bcryptjs'

const connectDB = async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}`);
        console.log('MongoDB connected successfully');
        const email = ("admin@welearn.com".toLocaleLowerCase()).trim();
        let webmaster = await UserModel.findOne({ role: 'admin' });

        if (!webmaster) {


            let new_user = new UserModel({
                fullName: "Admin",

                email: email,
                password: 'Hama@Hama1*',
                phoneNumber: "+216 55 555 555",

                role: 'admin',
            });
            await new_user.save();
            console.log(`webmaster account has been added : ${new_user.email}`);
        } else {
            console.log(`webmaster account already exists \n webmaster email : ${webmaster.email}`);
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