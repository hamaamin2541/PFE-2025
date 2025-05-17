import User from '../models/User.js';
import { checkAssistantEligibility, promoteToAssistant, demoteToStudent } from '../services/assistantService.js';
import mongoose from 'mongoose';

// Get all assistants
export const getAllAssistants = async (req, res) => {
  try {
    const assistants = await User.find({ role: 'assistant' })
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: assistants.length,
      data: assistants
    });
  } catch (error) {
    console.error('Error getting assistants:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Check if a student is eligible to be an assistant
export const checkEligibility = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'ID utilisateur invalide'
      });
    }
    
    // Check if user exists
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    // Check eligibility
    const eligibility = await checkAssistantEligibility(userId);
    
    res.status(200).json({
      success: true,
      data: {
        user,
        eligibility
      }
    });
  } catch (error) {
    console.error('Error checking eligibility:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Promote a student to assistant
export const promoteStudent = async (req, res) => {
  try {
    const { userId } = req.params;
    const { checkEligibility: shouldCheckEligibility = true } = req.body;
    
    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'ID utilisateur invalide'
      });
    }
    
    // Check if user exists
    const userExists = await User.findById(userId);
    
    if (!userExists) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    // Only teachers and admins can promote students
    if (!['teacher', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à promouvoir des étudiants'
      });
    }
    
    // Promote the student
    const updatedUser = await promoteToAssistant(userId, shouldCheckEligibility);
    
    // Remove password from response
    updatedUser.password = undefined;
    
    res.status(200).json({
      success: true,
      message: 'Étudiant promu au rôle d\'assistant avec succès',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error promoting student:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Demote an assistant to student
export const demoteAssistant = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'ID utilisateur invalide'
      });
    }
    
    // Check if user exists
    const userExists = await User.findById(userId);
    
    if (!userExists) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    // Only teachers and admins can demote assistants
    if (!['teacher', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à rétrograder des assistants'
      });
    }
    
    // Demote the assistant
    const updatedUser = await demoteToStudent(userId);
    
    // Remove password from response
    updatedUser.password = undefined;
    
    res.status(200).json({
      success: true,
      message: 'Assistant rétrogradé au rôle d\'étudiant avec succès',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error demoting assistant:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get eligible students for assistant role
export const getEligibleStudents = async (req, res) => {
  try {
    // Only teachers and admins can view eligible students
    if (!['teacher', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à voir les étudiants éligibles'
      });
    }
    
    // Get all students
    const students = await User.find({ role: 'student' }).select('-password');
    
    // Check eligibility for each student
    const eligibleStudents = [];
    
    for (const student of students) {
      const eligibility = await checkAssistantEligibility(student._id);
      
      if (eligibility.eligible) {
        eligibleStudents.push({
          ...student.toObject(),
          eligibility
        });
      }
    }
    
    res.status(200).json({
      success: true,
      count: eligibleStudents.length,
      data: eligibleStudents
    });
  } catch (error) {
    console.error('Error getting eligible students:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
