import mongoose from 'mongoose';
import Course from '../models/Course.js';
import User from '../models/User.js';
import Enrollment from '../models/Enrollment.js';
import Formation from '../models/Formation.js';
import Test from '../models/Test.js';

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
const ITEM_MODELS = {
  course:    Course,
  formation: Formation,
  test:      Test
};

const ITEM_PUSH_FIELD = {
  course:    'students',
  formation: 'students',
  test:      'participants'
};


export const enroll = async (req, res) => {
  try {
    const { itemId, itemType } = req.body;
    const userId = req.user._id;

    const validTypes = ['course','formation','test'];
    if (!itemId || !validTypes.includes(itemType)) {
      return res.status(400).json({
        success: false,
        message: 'itemId et itemType (course|formation|test) sont requis'
      });
    }

    const filter = {
      user:       userId,
      itemType,            
      [itemType]: itemId   
    };

    let enrollment = await Enrollment.findOne(filter);
    if (enrollment) {
      return res.status(200).json({
        success: true,
        enrolled: true,
        message: 'Vous êtes déjà inscrit à cet item',
        enrollment
      });
    }

    // 3. S'il n'existe pas, on crée un nouvel enrollment
    enrollment = await Enrollment.create(filter);

    // 4. Update the item's students/participants array
    const Model = ITEM_MODELS[itemType];
    const pushField = ITEM_PUSH_FIELD[itemType];
    
    if (Model && pushField) {
      await Model.findByIdAndUpdate(
        itemId,
        { $addToSet: { [pushField]: userId } }
      );
    }

    // 5. Add enrollment to user's enrollments array
    await User.findByIdAndUpdate(
      userId,
      { $addToSet: { enrollments: enrollment._id } }
    );

    return res.status(201).json({
      success: true,
      enrolled: true,
      enrollment
    });
  }
  catch (err) {
    console.error('Enrollment error:', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Update enrollment progress
export const updateEnrollmentProgress = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const { progress, status, completedSectionIndex } = req.body;

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

    // Check if this is a completion event
    const wasCompleted = enrollment.status === 'completed';
    const isNowCompleted = status === 'completed' || progress === 100;

    // Prepare update object
    const updateObj = {
      progress: progress !== undefined ? progress : enrollment.progress,
      status: status || enrollment.status,
      lastAccessDate: Date.now(),
      completionDate: isNowCompleted && !wasCompleted ? Date.now() : enrollment.completionDate
    };

    // If a section was completed, add it to the completedSections array if not already there
    if (completedSectionIndex !== undefined) {
      // Get current completed sections
      const completedSections = enrollment.completedSections || [];

      // Add the section if it's not already in the array
      if (!completedSections.includes(completedSectionIndex)) {
        completedSections.push(completedSectionIndex);
        updateObj.completedSections = completedSections;
      }
    }

    // Update enrollment
    const updatedEnrollment = await Enrollment.findByIdAndUpdate(
      enrollmentId,
      updateObj,
      { new: true }
    ).populate('course test formation');

    // Import gamification service
    const gamificationService = await import('../services/gamificationService.js');

    // Handle gamification for completion events
    if (isNowCompleted && !wasCompleted) {
      // Course completion
      if (enrollment.itemType === 'course' && enrollment.course) {
        await gamificationService.handleCourseCompletion(
          req.user._id,
          enrollment.course._id
        );
      }

      // Quiz/Test completion
      if (enrollment.itemType === 'test' && enrollment.test) {
        // Assume a score of 80% for now (in a real app, you'd get the actual score)
        const score = 80;
        await gamificationService.handleQuizCompletion(
          req.user._id,
          enrollment.test._id,
          score
        );
      }

      // Formation completion
      if (enrollment.itemType === 'formation' && enrollment.formation) {
        // Award points for formation completion (similar to course)
        await gamificationService.awardPoints(
          req.user._id,
          100,
          `completing formation ${enrollment.formation._id}`
        );
      }
    }

    // Update streak regardless of completion
    await gamificationService.updateStreak(req.user._id);

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
