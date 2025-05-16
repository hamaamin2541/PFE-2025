import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Test from '../models/Test.js';
import Formation from '../models/Formation.js';
import Enrollment from '../models/Enrollment.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Function to generate random date within a range
const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Function to generate random payment method
const randomPaymentMethod = () => {
  const methods = ['credit_card', 'paypal', 'bank_transfer'];
  return methods[Math.floor(Math.random() * methods.length)];
};

// Function to generate random transaction ID
const randomTransactionId = () => {
  return 'txn_' + Math.random().toString(36).substring(2, 15);
};

// Add sample enrollments with payment information
const addSampleEnrollments = async () => {
  try {
    // Get all students
    const students = await User.find({ role: 'student' });
    if (students.length === 0) {
      console.log('No students found. Please add some students first.');
      process.exit(0);
    }

    // Get all courses
    const courses = await Course.find();
    if (courses.length === 0) {
      console.log('No courses found. Please add some courses first.');
      process.exit(0);
    }

    // Get all tests
    const tests = await Test.find();
    
    // Get all formations
    const formations = await Formation.find();

    // Clear existing enrollments
    await Enrollment.deleteMany({});
    console.log('Cleared existing enrollments');

    const enrollments = [];
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

    // Create enrollments for courses
    for (const course of courses) {
      // Randomly select 5-15 students for each course
      const numStudents = Math.floor(Math.random() * 10) + 5;
      const selectedStudents = students.sort(() => 0.5 - Math.random()).slice(0, numStudents);

      for (const student of selectedStudents) {
        const enrollmentDate = randomDate(oneYearAgo, now);
        const amount = course.price;
        
        enrollments.push({
          user: student._id,
          course: course._id,
          itemType: 'course',
          enrollmentDate,
          progress: Math.floor(Math.random() * 100),
          status: 'active',
          paymentStatus: 'completed',
          paymentMethod: randomPaymentMethod(),
          transactionId: randomTransactionId(),
          amount
        });
      }
    }

    // Create enrollments for tests
    if (tests.length > 0) {
      for (const test of tests) {
        // Randomly select 3-10 students for each test
        const numStudents = Math.floor(Math.random() * 7) + 3;
        const selectedStudents = students.sort(() => 0.5 - Math.random()).slice(0, numStudents);

        for (const student of selectedStudents) {
          const enrollmentDate = randomDate(oneYearAgo, now);
          const amount = test.price;
          
          enrollments.push({
            user: student._id,
            test: test._id,
            itemType: 'test',
            enrollmentDate,
            progress: Math.floor(Math.random() * 100),
            status: 'active',
            paymentStatus: 'completed',
            paymentMethod: randomPaymentMethod(),
            transactionId: randomTransactionId(),
            amount
          });
        }
      }
    }

    // Create enrollments for formations
    if (formations.length > 0) {
      for (const formation of formations) {
        // Randomly select 2-8 students for each formation
        const numStudents = Math.floor(Math.random() * 6) + 2;
        const selectedStudents = students.sort(() => 0.5 - Math.random()).slice(0, numStudents);

        for (const student of selectedStudents) {
          const enrollmentDate = randomDate(oneYearAgo, now);
          const amount = formation.price;
          
          enrollments.push({
            user: student._id,
            formation: formation._id,
            itemType: 'formation',
            enrollmentDate,
            progress: Math.floor(Math.random() * 100),
            status: 'active',
            paymentStatus: 'completed',
            paymentMethod: randomPaymentMethod(),
            transactionId: randomTransactionId(),
            amount
          });
        }
      }
    }

    // Insert all enrollments
    await Enrollment.insertMany(enrollments);
    console.log(`Added ${enrollments.length} sample enrollments with payment information`);

    // Calculate total revenue
    const totalRevenue = enrollments.reduce((sum, enrollment) => sum + enrollment.amount, 0);
    console.log(`Total revenue: ${totalRevenue}`);

    process.exit(0);
  } catch (error) {
    console.error('Error adding sample enrollments:', error);
    process.exit(1);
  }
};

// Run the function
addSampleEnrollments();
