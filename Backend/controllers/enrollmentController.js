import Course from '../models/Course.js';
import User from '../models/User.js';
import Enrollment from '../models/Enrollment.js';

// Get all enrollments for the current user
export const getUserEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ user: req.user._id })
      .populate({
        path: 'course',
        select: 'title description coverImage category level price',
        populate: {
          path: 'teacher',
          select: 'fullName profileImage'
        }
      })
      .populate({
        path: 'formation',
        select: 'title description coverImage category price modules',
        populate: {
          path: 'teacher',
          select: 'fullName profileImage'
        }
      })
      .populate({
        path: 'test',
        select: 'title description coverImage category difficulty duration',
        populate: {
          path: 'teacher',
          select: 'fullName profileImage'
        }
      });

    res.status(200).json({
      success: true,
      data: enrollments
    });
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Enroll in a course, formation, or test
export const enrollInCourse = async (req, res) => {
  try {
    console.log('Enrollment request body:', req.body);
    const { itemId, itemType = 'course' } = req.body;

    if (!itemId) {
      console.log('Missing itemId in request');
      return res.status(400).json({
        success: false,
        message: 'Item ID is required'
      });
    }

    // Validate item type
    if (!['course', 'formation', 'test'].includes(itemType)) {
      console.log('Invalid itemType:', itemType);
      return res.status(400).json({
        success: false,
        message: 'Invalid item type. Must be course, formation, or test'
      });
    }

    console.log(`Processing enrollment for ${itemType} with ID: ${itemId}`);
    console.log('User ID:', req.user._id);

    let item;
    let existingEnrollment;
    let enrollmentData = {
      user: req.user._id,
      enrollmentDate: Date.now(),
      progress: 0,
      status: 'active',
      itemType
    };

    // Check if item exists based on type
    switch (itemType) {
      case 'course':
        item = await Course.findById(itemId);
        if (!item) {
          return res.status(404).json({
            success: false,
            message: 'Course not found'
          });
        }
        enrollmentData.course = itemId;

        // Check if user is already enrolled
        existingEnrollment = await Enrollment.findOne({
          user: req.user._id,
          itemType: 'course',
          course: itemId
        });
        break;

      case 'formation':
        console.log('Processing formation enrollment');
        // Import Formation model dynamically to avoid circular dependencies
        const Formation = (await import('../models/Formation.js')).default;
        console.log('Formation model imported');

        try {
          item = await Formation.findById(itemId);
          console.log('Formation query result:', item ? 'Found' : 'Not found');

          if (!item) {
            console.log(`Formation with ID ${itemId} not found`);
            return res.status(404).json({
              success: false,
              message: 'Formation not found'
            });
          }

          console.log('Formation found:', item.title);
          enrollmentData.formation = itemId;

          // Check if user is already enrolled
          existingEnrollment = await Enrollment.findOne({
            user: req.user._id,
            itemType: 'formation',
            formation: itemId
          });

          console.log('Existing enrollment check result:', existingEnrollment ? 'Already enrolled' : 'Not enrolled');
        } catch (formationError) {
          console.error('Error in formation processing:', formationError);
          return res.status(500).json({
            success: false,
            message: 'Error processing formation enrollment'
          });
        }
        break;

      case 'test':
        // Import Test model dynamically to avoid circular dependencies
        const Test = (await import('../models/Test.js')).default;
        item = await Test.findById(itemId);
        if (!item) {
          return res.status(404).json({
            success: false,
            message: 'Test not found'
          });
        }
        enrollmentData.test = itemId;

        // Check if user is already enrolled
        existingEnrollment = await Enrollment.findOne({
          user: req.user._id,
          itemType: 'test',
          test: itemId
        });
        break;
    }

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: `You are already enrolled in this ${itemType}`
      });
    }

    try {
      // Create enrollment
      const enrollment = await Enrollment.create(enrollmentData);

      // Update user's enrollments
      await User.findByIdAndUpdate(
        req.user._id,
        { $push: { enrollments: enrollment._id } }
      );

      // Update the item's students/participants array based on item type
      switch (itemType) {
        case 'course':
          // Add student to course's students array
          await Course.findByIdAndUpdate(
            itemId,
            { $addToSet: { students: req.user._id } }
          );
          break;

        case 'formation':
          // Add student to formation's students array
          const Formation = (await import('../models/Formation.js')).default;
          await Formation.findByIdAndUpdate(
            itemId,
            { $addToSet: { students: req.user._id } }
          );
          break;

        case 'test':
          // Add student to test's participants array
          const Test = (await import('../models/Test.js')).default;
          await Test.findByIdAndUpdate(
            itemId,
            {
              $addToSet: {
                participants: {
                  user: req.user._id,
                  score: 0,
                  completedAt: null
                }
              }
            }
          );
          break;
      }

      res.status(201).json({
        success: true,
        data: enrollment,
        message: `Successfully enrolled in the ${itemType}`
      });
    } catch (err) {
      // Check for duplicate key error
      if (err.code === 11000) {
        return res.status(400).json({
          success: false,
          message: `You are already enrolled in this ${itemType}`
        });
      }

      // Re-throw for the outer catch block
      throw err;
    }
  } catch (error) {
    console.error(`Error enrolling in ${req.body.itemType || 'course'}:`, error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during enrollment. Please try again.'
    });
  }
};

// Update enrollment progress
export const updateEnrollmentProgress = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const { progress, status } = req.body;

    // Check if enrollment exists and belongs to user
    const enrollment = await Enrollment.findOne({
      _id: enrollmentId,
      user: req.user._id
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found or does not belong to you'
      });
    }

    // Update enrollment
    const updatedEnrollment = await Enrollment.findByIdAndUpdate(
      enrollmentId,
      {
        progress: progress !== undefined ? progress : enrollment.progress,
        status: status || enrollment.status,
        lastAccessDate: Date.now()
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: updatedEnrollment
    });
  } catch (error) {
    console.error('Error updating enrollment:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get a specific enrollment
export const getEnrollment = async (req, res) => {
  try {
    const { enrollmentId } = req.params;

    const enrollment = await Enrollment.findOne({
      _id: enrollmentId,
      user: req.user._id
    })
      .populate({
        path: 'course',
        select: 'title description coverImage category level price sections',
        populate: {
          path: 'teacher',
          select: 'fullName profileImage'
        }
      })
      .populate({
        path: 'formation',
        select: 'title description coverImage category price modules',
        populate: {
          path: 'teacher',
          select: 'fullName profileImage'
        }
      })
      .populate({
        path: 'test',
        select: 'title description coverImage category difficulty duration questions',
        populate: {
          path: 'teacher',
          select: 'fullName profileImage'
        }
      });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found or does not belong to you'
      });
    }

    res.status(200).json({
      success: true,
      data: enrollment
    });
  } catch (error) {
    console.error('Error fetching enrollment:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
