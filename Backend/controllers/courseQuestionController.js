import CourseQuestion from '../models/CourseQuestion.js';
import Course from '../models/Course.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

// Get all pending questions (unresolved questions)
export const getPendingQuestions = async (req, res) => {
  try {
    // Check if the user is an assistant, teacher, or admin
    if (!['assistant', 'teacher', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé. Seuls les assistants, enseignants et administrateurs peuvent accéder à cette ressource.'
      });
    }

    // Get all unresolved questions
    const pendingQuestions = await CourseQuestion.find({
      isResolved: false,
      isInappropriate: false,
      // If the user is an assistant, only show questions that are not assigned to another assistant
      // or are assigned to this assistant
      $or: [
        { assignedAssistant: { $exists: false } },
        { assignedAssistant: null },
        { assignedAssistant: req.user._id }
      ]
    })
      .populate('user', 'fullName profileImage role')
      .populate('course', 'title teacher category')
      .populate('assignedAssistant', 'fullName profileImage')
      .sort({ createdAt: -1 });

    // Add additional information for each question
    const enhancedQuestions = pendingQuestions.map(question => {
      const questionObj = question.toObject();

      // Calculate how long the question has been waiting for an answer
      const waitingTime = question.answers.length === 0
        ? Math.floor((Date.now() - new Date(question.createdAt).getTime()) / (1000 * 60))
        : 0;

      // Check if this question is assigned to the current assistant
      const isAssignedToMe = question.assignedAssistant &&
        question.assignedAssistant._id.toString() === req.user._id.toString();

      // Add these properties to the question object
      return {
        ...questionObj,
        waitingTime,
        isAssignedToMe,
        answerCount: question.answers.length
      };
    });

    res.status(200).json({
      success: true,
      count: enhancedQuestions.length,
      data: enhancedQuestions
    });
  } catch (error) {
    console.error('Error getting pending questions:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

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
      updatedAt: Date.now(),
      // Check if the user is an assistant
      isAssistantAnswer: req.user.role === 'assistant'
    };

    // If this is the first answer, calculate response time
    if (question.answers.length === 0) {
      // Calculate time difference in minutes
      const questionCreatedAt = new Date(question.createdAt).getTime();
      const answerCreatedAt = Date.now();
      const responseTimeMinutes = Math.floor((answerCreatedAt - questionCreatedAt) / (1000 * 60));

      // Update question with response time data
      question.firstResponseTime = responseTimeMinutes;
      question.firstResponseByAssistant = req.user.role === 'assistant';

      // If the user is an assistant, assign the question to them
      if (req.user.role === 'assistant') {
        question.assignedAssistant = req.user._id;
        question.assignedAt = Date.now();
      }
    }

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

    // Track if resolved by an assistant
    question.resolvedByAssistant = req.user.role === 'assistant';

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

// Claim a question as an assistant
export const claimQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;

    // Validate question ID
    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de question invalide'
      });
    }

    // Check if the user is an assistant
    if (req.user.role !== 'assistant') {
      return res.status(403).json({
        success: false,
        message: 'Seuls les assistants peuvent réclamer des questions'
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

    // Check if the question is already assigned to another assistant
    if (question.assignedAssistant && question.assignedAssistant.toString() !== req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cette question est déjà assignée à un autre assistant'
      });
    }

    // Check if the question is already resolved
    if (question.isResolved) {
      return res.status(400).json({
        success: false,
        message: 'Cette question est déjà résolue'
      });
    }

    // Assign the question to this assistant
    question.assignedAssistant = req.user._id;
    question.assignedAt = Date.now();

    await question.save();

    // Populate fields for response
    await question.populate('assignedAssistant', 'fullName profileImage role');

    res.status(200).json({
      success: true,
      message: 'Question assignée avec succès',
      data: question
    });
  } catch (error) {
    console.error('Error claiming question:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Mark an answer as helpful
export const markAnswerAsHelpful = async (req, res) => {
  try {
    const { questionId, answerId } = req.params;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(questionId) || !mongoose.Types.ObjectId.isValid(answerId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de question ou de réponse invalide'
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

    // Check if user is the question author
    if (question.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Seul l\'auteur de la question peut marquer une réponse comme utile'
      });
    }

    // Find the answer
    const answer = question.answers.id(answerId);

    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'Réponse non trouvée'
      });
    }

    // Mark the answer as helpful
    answer.isMarkedHelpful = true;
    answer.markedHelpfulAt = Date.now();
    answer.updatedAt = Date.now();

    await question.save();

    // Get the updated question with populated fields
    const updatedQuestion = await CourseQuestion.findById(questionId)
      .populate('user', 'fullName profileImage role')
      .populate('answers.user', 'fullName profileImage role');

    // Get the updated answer
    const updatedAnswer = updatedQuestion.answers.id(answerId);

    res.status(200).json({
      success: true,
      data: updatedAnswer
    });
  } catch (error) {
    console.error('Error marking answer as helpful:', error);
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
