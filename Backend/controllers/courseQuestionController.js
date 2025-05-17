import CourseQuestion from '../models/CourseQuestion.js';
import Course from '../models/Course.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

// Get all questions for a course
export const getCourseQuestions = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // Validate course ID
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de cours invalide'
      });
    }
    
    // Get questions for the course
    const questions = await CourseQuestion.find({ course: courseId })
      .populate('user', 'fullName profileImage role')
      .populate('answers.user', 'fullName profileImage role')
      .populate('resolvedBy', 'fullName profileImage role')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: questions.length,
      data: questions
    });
  } catch (error) {
    console.error('Error getting course questions:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get a single question
export const getQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    
    // Validate question ID
    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de question invalide'
      });
    }
    
    // Get the question
    const question = await CourseQuestion.findById(questionId)
      .populate('user', 'fullName profileImage role')
      .populate('answers.user', 'fullName profileImage role')
      .populate('resolvedBy', 'fullName profileImage role')
      .populate('course', 'title');
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question non trouvée'
      });
    }
    
    // Increment view count
    question.views += 1;
    await question.save();
    
    res.status(200).json({
      success: true,
      data: question
    });
  } catch (error) {
    console.error('Error getting question:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create a new question
export const createQuestion = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, content, section } = req.body;
    
    // Validate course ID
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de cours invalide'
      });
    }
    
    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Cours non trouvé'
      });
    }
    
    // Create the question
    const question = new CourseQuestion({
      course: courseId,
      user: req.user._id,
      title,
      content,
      section: section || null
    });
    
    await question.save();
    
    // Populate user details for response
    await question.populate('user', 'fullName profileImage role');
    
    res.status(201).json({
      success: true,
      data: question
    });
  } catch (error) {
    console.error('Error creating question:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Add an answer to a question
export const addAnswer = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { content } = req.body;
    
    // Validate question ID
    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de question invalide'
      });
    }
    
    // Get the question
    const question = await CourseQuestion.findById(questionId);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question non trouvée'
      });
    }
    
    // Add the answer
    const answer = {
      user: req.user._id,
      content,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    question.answers.push(answer);
    await question.save();
    
    // Get the updated question with populated fields
    const updatedQuestion = await CourseQuestion.findById(questionId)
      .populate('user', 'fullName profileImage role')
      .populate('answers.user', 'fullName profileImage role');
    
    // Get the newly added answer
    const newAnswer = updatedQuestion.answers[updatedQuestion.answers.length - 1];
    
    res.status(201).json({
      success: true,
      data: newAnswer
    });
  } catch (error) {
    console.error('Error adding answer:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Mark a question as resolved
export const markAsResolved = async (req, res) => {
  try {
    const { questionId } = req.params;
    
    // Validate question ID
    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de question invalide'
      });
    }
    
    // Get the question
    const question = await CourseQuestion.findById(questionId);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question non trouvée'
      });
    }
    
    // Check if user is authorized to mark as resolved
    // Only the question author, instructors, assistants, or admins can mark as resolved
    const isAuthor = question.user.toString() === req.user._id.toString();
    const canModerate = ['teacher', 'assistant', 'admin'].includes(req.user.role);
    
    if (!isAuthor && !canModerate) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à marquer cette question comme résolue'
      });
    }
    
    // Mark as resolved
    question.isResolved = true;
    question.resolvedBy = req.user._id;
    question.resolvedAt = Date.now();
    
    await question.save();
    
    // Populate fields for response
    await question.populate('resolvedBy', 'fullName profileImage role');
    
    res.status(200).json({
      success: true,
      data: question
    });
  } catch (error) {
    console.error('Error marking question as resolved:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Mark content as inappropriate
export const markAsInappropriate = async (req, res) => {
  try {
    const { questionId, answerId } = req.params;
    const { reason } = req.body;
    
    // Validate question ID
    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de question invalide'
      });
    }
    
    // Get the question
    const question = await CourseQuestion.findById(questionId);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question non trouvée'
      });
    }
    
    // Check if user is authorized to mark as inappropriate
    // Only instructors, assistants, or admins can mark as inappropriate
    const canModerate = ['teacher', 'assistant', 'admin'].includes(req.user.role);
    
    if (!canModerate) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à marquer ce contenu comme inapproprié'
      });
    }
    
    // If answerId is provided, mark the answer as inappropriate
    if (answerId) {
      const answer = question.answers.id(answerId);
      
      if (!answer) {
        return res.status(404).json({
          success: false,
          message: 'Réponse non trouvée'
        });
      }
      
      answer.isInappropriate = true;
      answer.inappropriateReason = reason || 'Contenu inapproprié';
      answer.updatedAt = Date.now();
    } else {
      // Mark the question as inappropriate
      question.isInappropriate = true;
      question.inappropriateReason = reason || 'Contenu inapproprié';
    }
    
    await question.save();
    
    res.status(200).json({
      success: true,
      data: question
    });
  } catch (error) {
    console.error('Error marking content as inappropriate:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
