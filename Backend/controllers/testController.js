import Test from '../models/Test.js';

// Get all tests
export const getTests = async (req, res) => {
  try {
    // Populate teacher information to display teacher name with tests
    const tests = await Test.find()
      .populate('teacher', 'fullName profileImage')
      .sort({ createdAt: -1 }); // Sort by newest first

    res.status(200).json({ success: true, data: tests });
  } catch (error) {
    console.error('Error fetching tests:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single test
export const getTestById = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id)
      .populate('teacher', 'fullName profileImage');

    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }

    res.status(200).json({ success: true, data: test });
  } catch (error) {
    console.error('Error fetching test:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create a new test
export const createTest = async (req, res) => {
  try {
    let testData = {
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      duration: req.body.duration,
      difficulty: req.body.difficulty,
      price: req.body.price || 0,
      teacher: req.user._id,
      coverImage: req.files?.coverImage ? req.files.coverImage[0].path : null
    };

    if (req.body.questions) {
      const parsedQuestions = JSON.parse(req.body.questions);
      testData.questions = parsedQuestions;
    }

    // Process resources if they exist
    if (req.files && req.files.resources) {
      const resourceFiles = req.files.resources;
      const resourcesMetadata = req.body.resources ? JSON.parse(req.body.resources) : [];

      // Create resources array
      testData.resources = resourceFiles.map((file, index) => {
        const metadata = resourcesMetadata[index] || {};
        return {
          name: metadata.name || file.originalname.split('.')[0],
          type: metadata.type || determineFileType(file.originalname),
          file: file.path,
          size: file.size
        };
      });
    }

    const test = await Test.create(testData);

    res.status(201).json({
      success: true,
      data: test
    });
  } catch (error) {
    console.error('Error creating test:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Helper function to determine file type based on extension
const determineFileType = (filename) => {
  const extension = filename.split('.').pop().toLowerCase();

  if (['mp4', 'webm', 'ogg', 'mov'].includes(extension)) {
    return 'video';
  } else if (extension === 'pdf') {
    return 'pdf';
  } else if (['doc', 'docx', 'txt', 'ppt', 'pptx', 'xls', 'xlsx'].includes(extension)) {
    return 'document';
  } else if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension)) {
    return 'image';
  } else if (['mp3', 'wav', 'ogg'].includes(extension)) {
    return 'audio';
  }

  return 'other';
};

// Update a test
export const updateTest = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);

    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }

    // Check if the user is the test creator
    if (test.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this test' });
    }

    let updateData = {
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      duration: req.body.duration,
      difficulty: req.body.difficulty,
      price: req.body.price
    };

    if (req.files?.coverImage) {
      updateData.coverImage = req.files.coverImage[0].path;
    }

    if (req.body.questions) {
      updateData.questions = JSON.parse(req.body.questions);
    }

    // Handle resources
    if (req.files && req.files.resources) {
      const resourceFiles = req.files.resources;
      const resourcesMetadata = req.body.resources ? JSON.parse(req.body.resources) : [];

      // Create new resources array
      const newResources = resourceFiles.map((file, index) => {
        const metadata = resourcesMetadata[index] || {};
        return {
          name: metadata.name || file.originalname.split('.')[0],
          type: metadata.type || determineFileType(file.originalname),
          file: file.path,
          size: file.size
        };
      });

      // Handle existing resources
      if (req.body.keepExistingResources === 'true') {
        // Keep existing resources that are not being replaced
        const existingResources = test.resources || [];
        const existingResourcesFiltered = existingResources.filter(resource => {
          // Check if this resource is not being replaced by a new one with the same name
          return !resourcesMetadata.some(meta => meta.name === resource.name);
        });

        // Combine existing and new resources
        updateData.resources = [...existingResourcesFiltered, ...newResources];
      } else {
        // Replace all resources
        updateData.resources = newResources;
      }
    } else if (req.body.removeAllResources === 'true') {
      // Remove all resources
      updateData.resources = [];
    }

    const updatedTest = await Test.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedTest
    });
  } catch (error) {
    console.error('Error updating test:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete a test
export const deleteTest = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);

    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }

    // Check if the user is the test creator
    if (test.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this test' });
    }

    await Test.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Test deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting test:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get teacher's tests
export const getTeacherTests = async (req, res) => {
  try {
    const tests = await Test.find({ teacher: req.user._id });
    res.status(200).json({
      success: true,
      data: tests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
