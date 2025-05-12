import mongoose from 'mongoose';
import dotenv from 'dotenv';
import colors from 'colors';
import Course from '../models/Course.js';
import User from '../models/User.js';
import Enrollment from '../models/Enrollment.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB Connected'.cyan.underline);
    testRevenueCalculation();
  })
  .catch(err => {
    console.error('MongoDB connection error:'.red.bold, err);
    process.exit(1);
  });

async function testRevenueCalculation() {
  try {
    // Import Test and Formation models
    const Test = (await import('../models/Test.js')).default;
    const Formation = (await import('../models/Formation.js')).default;

    // 1. Get a teacher
    const teacher = await User.findOne({ role: 'teacher' });
    if (!teacher) {
      console.log('No teacher found in the database'.red);
      process.exit(1);
    }
    console.log(`Found teacher: ${teacher.fullName}`.green);

    // 2. Get a student
    const student = await User.findOne({ role: 'student' });
    if (!student) {
      console.log('No student found in the database'.red);
      process.exit(1);
    }
    console.log(`Found student: ${student.fullName}`.green);

    // 3. Get teacher's analytics before enrollment
    console.log('\nTeacher analytics BEFORE enrollment:'.yellow.bold);
    const analyticsBefore = await getTeacherAnalytics(teacher._id);
    console.log(`- Total students: ${analyticsBefore.totalStudents}`.cyan);
    console.log(`- Total revenue: ${analyticsBefore.totalRevenue}€`.cyan);

    // 4. Create a test course with a specific price
    console.log('\nCreating test course...'.yellow);
    const coursePrice = 50; // 50€
    const testCourse = new Course({
      title: 'Test Course for Revenue Calculation',
      description: 'This is a test course to verify revenue calculation',
      category: 'Test',
      price: coursePrice,
      language: 'French',
      level: 'Beginner',
      teacher: teacher._id
    });
    await testCourse.save();
    console.log(`Created test course with price ${coursePrice}€`.green);

    // 5. Enroll the student in the course
    console.log('\nEnrolling student in the course...'.yellow);
    testCourse.students.push(student._id);
    await testCourse.save();
    console.log('Student enrolled in the course'.green);

    // 6. Create enrollment record
    const enrollmentData = {
      user: student._id,
      course: testCourse._id,
      itemType: 'course',
      enrollmentDate: Date.now(),
      progress: 0,
      status: 'active'
    };
    const enrollment = await Enrollment.create(enrollmentData);
    console.log(`Created enrollment record: ${enrollment._id}`.green);

    // 7. Update user's enrollments
    await User.findByIdAndUpdate(
      student._id,
      { $push: { enrollments: enrollment._id } }
    );
    console.log(`Updated student's enrollments`.green);

    // 8. Get teacher's analytics after enrollment
    console.log('\nTeacher analytics AFTER enrollment:'.yellow.bold);
    const analyticsAfter = await getTeacherAnalytics(teacher._id);
    console.log(`- Total students: ${analyticsAfter.totalStudents}`.cyan);
    console.log(`- Total revenue: ${analyticsAfter.totalRevenue}€`.cyan);

    // 9. Check if revenue increased by the course price
    const revenueIncrease = analyticsAfter.totalRevenue - analyticsBefore.totalRevenue;
    if (revenueIncrease === coursePrice) {
      console.log(`\nSUCCESS: Revenue increased by exactly ${coursePrice}€!`.green.bold);
    } else {
      console.log(`\nFAILURE: Revenue increased by ${revenueIncrease}€, expected ${coursePrice}€`.red.bold);
    }

    // 10. Clean up test data
    console.log('\nCleaning up test data...'.yellow);
    await Enrollment.findByIdAndDelete(enrollment._id);
    await Course.findByIdAndDelete(testCourse._id);
    await User.findByIdAndUpdate(
      student._id,
      { $pull: { enrollments: enrollment._id } }
    );
    console.log('Test data cleaned up'.green);

    // Exit the process
    console.log('\nDone!'.green.bold);
    process.exit(0);
  } catch (error) {
    console.error('Error in test:'.red.bold, error);
    process.exit(1);
  }
}

// Function to calculate teacher analytics (similar to the controller function)
async function getTeacherAnalytics(teacherId) {
  // Get courses, tests, and formations in parallel
  const [courses, tests, formations, teacher] = await Promise.all([
    Course.find({ teacher: teacherId })
      .populate('students')
      .populate('enrollments.student')
      .populate('ratings.user'),
    (await import('../models/Test.js')).default.find({ teacher: teacherId })
      .populate('participants.user'),
    (await import('../models/Formation.js')).default.find({ teacher: teacherId })
      .populate('students'),
    User.findById(teacherId).populate('ratings')
  ]);

  // Calculate statistics
  const stats = {
    totalStudents: 0,
    totalCourses: courses.length,
    totalTests: tests.length,
    totalFormations: formations.length,
    totalRevenue: 0,
    averageRating: 0
  };

  // Create a Set to track unique student IDs across all content types
  const uniqueStudentIds = new Set();

  // Process courses
  courses.forEach(course => {
    // Add unique students to the set
    course.students?.forEach(student => {
      uniqueStudentIds.add(student._id.toString());
    });
    
    // Calculate revenue
    stats.totalRevenue += (course.price * (course.students?.length || 0));
  });

  // Process tests
  tests.forEach(test => {
    // Add unique participants to the set
    test.participants?.forEach(participant => {
      if (participant.user && participant.user._id) {
        uniqueStudentIds.add(participant.user._id.toString());
      }
    });
    
    // If tests have a price, add to revenue
    if (test.price) {
      stats.totalRevenue += (test.price * (test.participants?.length || 0));
    }
  });

  // Process formations
  formations.forEach(formation => {
    // Add unique students to the set
    formation.students?.forEach(student => {
      uniqueStudentIds.add(student._id.toString());
    });
    
    // Add revenue from formations
    stats.totalRevenue += (formation.price * (formation.students?.length || 0));
  });

  // Set the total unique students count
  stats.totalStudents = uniqueStudentIds.size;

  return stats;
}
