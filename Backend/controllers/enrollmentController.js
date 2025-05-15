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

// Pour savoir dans quel champ de l’item on pousse l’utilisateur
const ITEM_PUSH_FIELD = {
  course:    'students',
  formation: 'students',
  test:      'participants'
};


export const enroll = async (req, res) => {
  try {
    const { itemId, itemType } = req.body;
    const userId = req.user._id;

    // 1. Validation basique
    const validTypes = ['course','formation','test'];
    if (!itemId || !validTypes.includes(itemType)) {
      return res.status(400).json({
        success: false,
        message: 'itemId et itemType (course|formation|test) sont requis'
      });
    }

    // 2. Filtre AND : user + itemType + champ correspondant
    const filter = {
      user:       userId,
      itemType,             // s’assure de ne pas confondre plusieurs types
      [itemType]: itemId    // ex. { test: ObjectId(...) }
    };

    let enrollment = await Enrollment.findOne(filter);
    if (enrollment) {
      return res.status(200).json({
        success: false,
        enrolled: false,
        message: 'Vous êtes déjà inscrit à cet item',
      });
    }

    // 4. S’il n’existe pas, on crée un nouvel enrollment
    enrollment = await Enrollment.create(filter);

    return res.status(201).json({
      success: true,
      enrolled: false,
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
