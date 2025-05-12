import TeacherAdvice from '../models/TeacherAdvice.js';
import path from 'path';

export const getAllAdvice = async (req, res) => {
  try {
    const advice = await TeacherAdvice.find()
      .populate('teacher', 'fullName email profileImage specialty')
      .sort('-createdAt')
      .lean();

    res.status(200).json({
      success: true,
      data: advice
    });
  } catch (error) {
    console.error('Error fetching advice:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching teacher advice'
    });
  }
};

export const createAdvice = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);

    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    if (!req.file && req.body.type === 'video') {
      return res.status(400).json({
        success: false,
        message: 'Video file is required for video advice'
      });
    }

    // Log the file information for debugging
    if (req.file) {
      console.log('Video file details:', {
        filename: req.file.filename,
        path: req.file.path,
        mimetype: req.file.mimetype,
        size: req.file.size
      });
    }

    // Ensure the videoPath is correctly formatted
    let videoPath;
    if (req.file) {
      // Make sure the filename starts with 'video-' for consistency
      const filename = req.file.filename.startsWith('video-')
        ? req.file.filename
        : `video-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(req.file.originalname)}`;

      // Store the path with the correct format
      videoPath = `/uploads/videos/${filename}`;
      console.log('Final video path to be stored:', videoPath);
    }

    const newAdvice = new TeacherAdvice({
      content: content,
      type: req.body.type || 'text',
      videoPath: videoPath,
      teacher: req.user._id
    });

    const savedAdvice = await newAdvice.save();
    await savedAdvice.populate('teacher', 'fullName specialty');

    res.status(201).json({
      success: true,
      data: savedAdvice
    });
  } catch (error) {
    console.error('Error creating advice:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating advice'
    });
  }
};
