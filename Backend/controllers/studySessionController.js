import StudySession from '../models/StudySession.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import crypto from 'crypto';

// Create a new study session
export const createStudySession = async (req, res) => {
  try {
    const { courseId, guestEmail, scheduledTime } = req.body;

    // Validate course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Find the guest user by email
    const guestUser = await User.findOne({ email: guestEmail });
    if (!guestUser) {
      return res.status(404).json({
        success: false,
        message: 'User with this email not found'
      });
    }

    // Check if the guest is the same as the host
    if (guestUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot invite yourself'
      });
    }

    // Generate a unique invite token
    const inviteToken = crypto.randomBytes(20).toString('hex');

    // Create the study session
    const studySession = new StudySession({
      course: courseId,
      host: req.user._id,
      guest: guestUser._id,
      inviteToken,
      scheduledTime: scheduledTime || undefined
    });

    await studySession.save();

    // Return the created session
    res.status(201).json({
      success: true,
      data: studySession
    });
  } catch (error) {
    console.error('Error creating study session:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating study session',
      error: error.message
    });
  }
};

// Get study sessions for the current user (both as host and guest)
export const getUserStudySessions = async (req, res) => {
  try {
    const studySessions = await StudySession.find({
      $or: [
        { host: req.user._id },
        { guest: req.user._id }
      ]
    })
    .populate('course', 'title description coverImage')
    .populate('host', 'fullName email profileImage')
    .populate('guest', 'fullName email profileImage')
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: studySessions
    });
  } catch (error) {
    console.error('Error fetching study sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching study sessions',
      error: error.message
    });
  }
};

// Get a specific study session by ID
export const getStudySessionById = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const studySession = await StudySession.findById(sessionId)
      .populate('course', 'title description coverImage sections')
      .populate('host', 'fullName email profileImage')
      .populate('guest', 'fullName email profileImage');

    if (!studySession) {
      return res.status(404).json({
        success: false,
        message: 'Study session not found'
      });
    }

    // Check if the current user is either the host or the guest
    if (
      studySession.host._id.toString() !== req.user._id.toString() &&
      studySession.guest._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to access this study session'
      });
    }

    res.status(200).json({
      success: true,
      data: studySession
    });
  } catch (error) {
    console.error('Error fetching study session:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching study session',
      error: error.message
    });
  }
};

// Accept a study session invitation
export const acceptStudySession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const studySession = await StudySession.findById(sessionId);
    if (!studySession) {
      return res.status(404).json({
        success: false,
        message: 'Study session not found'
      });
    }

    // Check if the current user is the guest
    if (studySession.guest.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to accept this invitation'
      });
    }

    // Check if the invitation is still valid
    if (studySession.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'This invitation is no longer valid'
      });
    }

    // Update the session status
    studySession.status = 'active';
    await studySession.save();

    res.status(200).json({
      success: true,
      data: studySession
    });
  } catch (error) {
    console.error('Error accepting study session:', error);
    res.status(500).json({
      success: false,
      message: 'Error accepting study session',
      error: error.message
    });
  }
};

// Cancel a study session
export const cancelStudySession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const studySession = await StudySession.findById(sessionId);
    if (!studySession) {
      return res.status(404).json({
        success: false,
        message: 'Study session not found'
      });
    }

    // Check if the current user is either the host or the guest
    if (
      studySession.host.toString() !== req.user._id.toString() &&
      studySession.guest.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to cancel this session'
      });
    }

    // Update the session status
    studySession.status = 'cancelled';
    await studySession.save();

    res.status(200).json({
      success: true,
      message: 'Study session cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling study session:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling study session',
      error: error.message
    });
  }
};

// Add a message to the study session
export const addMessage = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    const studySession = await StudySession.findById(sessionId);
    if (!studySession) {
      return res.status(404).json({
        success: false,
        message: 'Study session not found'
      });
    }

    // Check if the current user is either the host or the guest
    if (
      studySession.host.toString() !== req.user._id.toString() &&
      studySession.guest.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to send messages in this session'
      });
    }

    // Add the message
    studySession.messages.push({
      sender: req.user._id,
      content
    });

    await studySession.save();

    // Return the added message
    const newMessage = studySession.messages[studySession.messages.length - 1];

    res.status(201).json({
      success: true,
      data: newMessage
    });
  } catch (error) {
    console.error('Error adding message:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding message',
      error: error.message
    });
  }
};
