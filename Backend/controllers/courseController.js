import Course from '../models/Course.js';
import mongoose from 'mongoose';

// Get all courses
export const getCourses = async (req, res) => {
  try {
    // Populate teacher information to display teacher name with courses
    const courses = await Course.find()
      .populate('teacher', 'fullName profileImage')
      .sort({ createdAt: -1 }); // Sort by newest first

    res.status(200).json({ success: true, data: courses });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get a single course by ID (authenticated)
export const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Only increment views if the viewer is not the course creator
    if (course.teacher.toString() !== req.user._id.toString()) {
      course.views = (course.views || 0) + 1;
      await course.save();
    }

    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get a single course by ID (public)
export const getPublicCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('teacher', 'fullName profileImage specialty');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Increment the views count for public views
    course.views = (course.views || 0) + 1;
    await course.save();

    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create a new course

export const createCourse = async (req, res) => {
  try {
    // 1) Base courseData
    const courseData = {
      title:       req.body.title,
      description: req.body.description,
      category:    req.body.category,
      price:       req.body.price,
      language:    req.body.language,
      level:       req.body.level,
      teacher:     req.user._id,
      coverImage:  req.files.coverImage
                   ? req.files.coverImage[0].path
                   : null
    };

    const sectionsMeta = JSON.parse(req.body.sectionsMeta || '[]');

   courseData.sections = sectionsMeta.map((secMeta) => ({
  ...secMeta,
  resources: (req.files.resources || []).map(file => ({
    name: file.originalname,
    type: file.mimetype,
    size: file.size,
    file: file.path
  }))
}));

    const course = await Course.create(courseData);
    res.status(201).json({ success: true, data: course });
  }
  catch (error) {
    console.error('Course creation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};



// Update a course
export const updateCourse = async (req, res) => {
  try {
    let course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (course.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Handle file uploads
    const updateData = { ...req.body };

    // Update cover image if provided
    if (req.files && req.files.coverImage) {
      updateData.coverImage = req.files.coverImage[0].path;
    }

    // Parse and update sections if provided
    if (req.body.sections) {
      try {
        updateData.sections = JSON.parse(req.body.sections);
      } catch (err) {
        console.error('Error parsing sections:', err);
        return res.status(400).json({
          success: false,
          message: 'Invalid sections data format'
        });
      }
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedCourse
    });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating course'
    });
  }
};

// Delete a course
export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if the logged-in teacher owns this course
    if (course.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this course'
      });
    }

    await Course.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting course'
    });
  }
};

// Enroll a student in a course
export const enrollInCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (course.students.includes(req.user.id)) {
      return res.status(400).json({ success: false, message: 'Already enrolled in this course' });
    }

    course.students.push(req.user.id);
    await course.save();

    res.status(200).json({ success: true, message: 'Enrolled successfully', data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get teacher's courses
export const getTeacherCourses = async (req, res) => {
  try {
    const courses = await Course.find({ teacher: req.user._id });
    res.status(200).json({
      success: true,
      data: courses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get courses by teacher
export const getCoursesByTeacher = async (req, res) => {
  try {
    const courses = await Course.find({ teacher: req.user._id });
    res.status(200).json({
      success: true,
      data: courses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get course count
export const getCourseCount = async (req, res) => {
  try {
    const count = await Course.countDocuments({ teacher: req.user._id });
    res.status(200).json({
      success: true,
      count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get teacher analytics
export const getTeacherAnalytics = async (req, res) => {
  try {
    const teacherId = req.user._id;

    // Import Test and Formation models
    let Test, Formation, User, Enrollment;

    try {
      Test = (await import('../models/Test.js')).default;
      Formation = (await import('../models/Formation.js')).default;
      User = (await import('../models/User.js')).default;
      Enrollment = (await import('../models/Enrollment.js')).default;
    } catch (importError) {
      console.error('Error importing models:', importError);
      return res.status(200).json({
        success: true,
        data: {
          totalStudents: 0,
          totalCourses: 0,
          totalTests: 0,
          totalFormations: 0,
          totalRevenue: 0,
          averageRating: 0,
          totalViews: 0,
          courseViews: [],
          revenueData: [],
          enrollmentData: [],
          contentDistribution: []
        }
      });
    }

    // Get courses, tests, formations, enrollments, and teacher in parallel
    let courses = [], tests = [], formations = [], enrollments = [], teacher = null;

    try {
      // Get course IDs, test IDs, and formation IDs first to avoid nested queries
      const courseIds = await Course.find({ teacher: teacherId }).select('_id');
      const testIds = await Test.find({ teacher: teacherId }).select('_id');
      const formationIds = await Formation.find({ teacher: teacherId }).select('_id');

      // Now use these IDs in the parallel queries
      [courses, tests, formations, enrollments, teacher] = await Promise.all([
        Course.find({ teacher: teacherId })
          .populate('students')
          .populate('enrollments.student')
          .populate('ratings.user'),
        Test.find({ teacher: teacherId })
          .populate('participants.user'),
        Formation.find({ teacher: teacherId })
          .populate('students'),
        Enrollment.find({
          $or: [
            { course: { $in: courseIds } },
            { test: { $in: testIds } },
            { formation: { $in: formationIds } }
          ]
        })
        .populate('user')
        .populate('course')
        .populate('test')
        .populate('formation')
        .sort({ enrollmentDate: -1 }),
        User.findById(teacherId).populate('ratings')
      ]);
    } catch (queryError) {
      console.error('Error querying data:', queryError);
      // Return default values if queries fail
      return res.status(200).json({
        success: true,
        data: {
          totalStudents: 0,
          totalCourses: 0,
          totalTests: 0,
          totalFormations: 0,
          totalRevenue: 0,
          averageRating: 0,
          totalViews: 0,
          courseViews: [],
          revenueData: [],
          enrollmentData: [],
          contentDistribution: []
        }
      });
    }

    // Calculate statistics
    const stats = {
      totalStudents: 0,
      totalCourses: courses.length,
      totalTests: tests.length,
      totalFormations: formations.length,
      totalRevenue: 0,
      averageRating: 0,
      totalViews: 0,
      courseViews: [],
      revenueData: [],
      enrollmentData: [],
      contentDistribution: []
    };

    // Create a Set to track unique student IDs across all content types
    const uniqueStudentIds = new Set();

    let totalRatings = 0;
    let ratingCount = 0;

    // Calculate total revenue from enrollments (sum of all sales)
    enrollments.forEach(enrollment => {
      // Find the price based on the item type
      let price = 0;
      if (enrollment.itemType === 'course' && enrollment.course) {
        // Use the populated course object directly
        price = enrollment.course.price || 0;
      } else if (enrollment.itemType === 'test' && enrollment.test) {
        // Use the populated test object directly
        price = enrollment.test.price || 0;
      } else if (enrollment.itemType === 'formation' && enrollment.formation) {
        // Use the populated formation object directly
        price = enrollment.formation.price || 0;
      }

      // Add to total revenue
      stats.totalRevenue += price;

      // Add unique student to the set
      if (enrollment.user && enrollment.user._id) {
        uniqueStudentIds.add(enrollment.user._id.toString());
      }
    });

    // Process courses for views and ratings
    courses.forEach(course => {
      // Add unique students to the set (as a backup)
      course.students?.forEach(student => {
        uniqueStudentIds.add(student._id.toString());
      });

      // Calculate average rating
      course.ratings?.forEach(rating => {
        totalRatings += rating.value;
        ratingCount++;
      });

      // Track views
      const views = course.views || 0;
      stats.totalViews += views;

      // Add course view data for the chart
      stats.courseViews.push({
        id: course._id,
        title: course.title,
        views: views,
        students: course.students?.length || 0
      });
    });

    // Process tests for unique students (as a backup)
    tests.forEach(test => {
      // Add unique participants to the set
      test.participants?.forEach(participant => {
        if (participant.user && participant.user._id) {
          uniqueStudentIds.add(participant.user._id.toString());
        }
      });
    });

    // Process formations for unique students (as a backup)
    formations.forEach(formation => {
      // Add unique students to the set
      formation.students?.forEach(student => {
        uniqueStudentIds.add(student._id.toString());
      });
    });

    // Set the total unique students count
    stats.totalStudents = uniqueStudentIds.size;

    // Calculate teacher's average rating
    if (teacher && teacher.ratings && teacher.ratings.length > 0) {
      const teacherRatingSum = teacher.ratings.reduce((sum, rating) => sum + rating.value, 0);
      stats.averageRating = (teacherRatingSum / teacher.ratings.length).toFixed(1);
    } else if (ratingCount > 0) {
      // Fallback to course ratings if teacher ratings don't exist
      stats.averageRating = (totalRatings / ratingCount).toFixed(1);
    } else {
      stats.averageRating = 0;
    }

    // Generate content distribution data
    stats.contentDistribution = [
      { name: 'Cours', value: stats.totalCourses },
      { name: 'Tests', value: stats.totalTests },
      { name: 'Formations', value: stats.totalFormations }
    ];

    // Get revenue period from query params (default to full year)
    const revenuePeriod = req.query.revenuePeriod || 'year';

    // Generate revenue data by month
    const revenueByMonth = {};
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    // Initialize months based on selected period
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    let monthsToShow = [];

    if (revenuePeriod === '3months') {
      // Last 3 months
      for (let i = 2; i >= 0; i--) {
        const monthIndex = (currentMonth - i + 12) % 12;
        monthsToShow.push(months[monthIndex]);
      }
    } else if (revenuePeriod === '6months') {
      // Last 6 months
      for (let i = 5; i >= 0; i--) {
        const monthIndex = (currentMonth - i + 12) % 12;
        monthsToShow.push(months[monthIndex]);
      }
    } else {
      // Full year
      monthsToShow = [...months];
    }

    // Initialize all selected months with zero revenue
    monthsToShow.forEach(month => {
      revenueByMonth[month] = 0;
    });

    // Calculate start date based on period
    let startDate = new Date();
    if (revenuePeriod === '3months') {
      startDate.setMonth(startDate.getMonth() - 3);
    } else if (revenuePeriod === '6months') {
      startDate.setMonth(startDate.getMonth() - 6);
    } else {
      startDate = new Date(currentYear, 0, 1); // Start of year
    }

    // Process enrollments to calculate revenue by month
    enrollments.forEach(enrollment => {
      if (enrollment.enrollmentDate) {
        const enrollmentDate = new Date(enrollment.enrollmentDate);
        // Only consider enrollments from the selected period
        if (enrollmentDate >= startDate) {
          const monthIndex = enrollmentDate.getMonth();
          const monthName = months[monthIndex];

          // Only process if this month is in our display set
          if (monthsToShow.includes(monthName)) {
            // Find the price based on the item type
            let price = 0;
            if (enrollment.itemType === 'course' && enrollment.course) {
              // Use the populated course object directly
              price = enrollment.course.price || 0;
            } else if (enrollment.itemType === 'test' && enrollment.test) {
              // Use the populated test object directly
              price = enrollment.test.price || 0;
            } else if (enrollment.itemType === 'formation' && enrollment.formation) {
              // Use the populated formation object directly
              price = enrollment.formation.price || 0;
            }

            revenueByMonth[monthName] += price;
          }
        }
      }
    });

    // Convert revenue by month to array format for the chart
    stats.revenueData = monthsToShow.map(month => ({
      name: month,
      revenue: revenueByMonth[month]
    }));

    // Get enrollment period from query params (default to month)
    const enrollmentPeriod = req.query.enrollmentPeriod || 'month';

    // Generate enrollment data based on period
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

    if (enrollmentPeriod === 'month') {
      // Enrollments by day of week for the current month
      const enrollmentsByDay = {
        'Lun': 0, 'Mar': 0, 'Mer': 0, 'Jeu': 0, 'Ven': 0, 'Sam': 0, 'Dim': 0
      };

      // Get start of current month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      enrollments.forEach(enrollment => {
        if (enrollment.enrollmentDate) {
          const enrollmentDate = new Date(enrollment.enrollmentDate);
          if (enrollmentDate >= startOfMonth) {
            const dayOfWeek = days[enrollmentDate.getDay()];
            enrollmentsByDay[dayOfWeek]++;
          }
        }
      });

      // Convert enrollments by day to array format for the chart
      stats.enrollmentData = Object.keys(enrollmentsByDay).map(day => ({
        name: day,
        enrollments: enrollmentsByDay[day]
      }));
    } else {
      // Enrollments by month for the current year
      const enrollmentsByMonth = {};
      months.forEach(month => {
        enrollmentsByMonth[month] = 0;
      });

      // Get start of current year
      const startOfYear = new Date(currentYear, 0, 1);

      enrollments.forEach(enrollment => {
        if (enrollment.enrollmentDate) {
          const enrollmentDate = new Date(enrollment.enrollmentDate);
          if (enrollmentDate >= startOfYear && enrollmentDate.getFullYear() === currentYear) {
            const monthName = months[enrollmentDate.getMonth()];
            enrollmentsByMonth[monthName]++;
          }
        }
      });

      // Convert enrollments by month to array format for the chart
      stats.enrollmentData = months.map(month => ({
        name: month,
        enrollments: enrollmentsByMonth[month]
      }));
    }

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Analytics error:', error);
    // Instead of returning a 500 error, return a successful response with default values
    // This prevents the frontend from breaking when there's an error
    res.status(200).json({
      success: true,
      data: {
        totalStudents: 0,
        totalCourses: 0,
        totalTests: 0,
        totalFormations: 0,
        totalRevenue: 0,
        averageRating: 0,
        totalViews: 0,
        courseViews: [],
        revenueData: [],
        enrollmentData: [],
        contentDistribution: []
      },
      message: 'Using default values due to an error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
