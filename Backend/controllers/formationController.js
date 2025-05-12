import Formation from '../models/Formation.js';

// Get all formations
export const getFormations = async (req, res) => {
  try {
    // Populate teacher information to display teacher name with formations
    const formations = await Formation.find()
      .populate('teacher', 'fullName profileImage')
      .sort({ createdAt: -1 }); // Sort by newest first

    res.status(200).json({ success: true, data: formations });
  } catch (error) {
    console.error('Error fetching formations:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single formation
export const getFormationById = async (req, res) => {
  try {
    const formation = await Formation.findById(req.params.id)
      .populate('teacher', 'fullName profileImage');

    if (!formation) {
      return res.status(404).json({ success: false, message: 'Formation not found' });
    }

    res.status(200).json({ success: true, data: formation });
  } catch (error) {
    console.error('Error fetching formation:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create a new formation
export const createFormation = async (req, res) => {
  try {
    let formationData = {
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      price: req.body.price,
      duration: req.body.duration,
      level: req.body.level,
      language: req.body.language,
      teacher: req.user._id,
      coverImage: req.files?.coverImage ? req.files.coverImage[0].path : null
    };

    if (req.body.modules) {
      const parsedModules = JSON.parse(req.body.modules);

      // Process module resources if they exist
      if (req.files && req.files.resources) {
        const resourceFiles = req.files.resources;
        const moduleResources = req.body.moduleResources ? JSON.parse(req.body.moduleResources) : [];

        // Map resources to their respective modules
        moduleResources.forEach(resource => {
          const moduleIndex = resource.moduleIndex;
          const resourceFile = resourceFiles.find(file => file.originalname === resource.fileName);

          if (resourceFile && moduleIndex < parsedModules.length) {
            // Initialize resources array if it doesn't exist
            if (!parsedModules[moduleIndex].resources) {
              parsedModules[moduleIndex].resources = [];
            }

            // Add resource to the module
            parsedModules[moduleIndex].resources.push({
              name: resource.name,
              type: resource.type,
              file: resourceFile.path,
              size: resourceFile.size
            });
          }
        });
      }

      formationData.modules = parsedModules;
    }

    const formation = await Formation.create(formationData);

    res.status(201).json({
      success: true,
      data: formation
    });
  } catch (error) {
    console.error('Error creating formation:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Update a formation
export const updateFormation = async (req, res) => {
  try {
    const formation = await Formation.findById(req.params.id);

    if (!formation) {
      return res.status(404).json({ success: false, message: 'Formation not found' });
    }

    // Check if the user is the formation creator
    if (formation.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this formation' });
    }

    let updateData = {
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      price: req.body.price,
      duration: req.body.duration,
      level: req.body.level,
      language: req.body.language
    };

    if (req.files?.coverImage) {
      updateData.coverImage = req.files.coverImage[0].path;
    }

    if (req.body.modules) {
      const parsedModules = JSON.parse(req.body.modules);

      // Process module resources if they exist
      if (req.files && req.files.resources) {
        const resourceFiles = req.files.resources;
        const moduleResources = req.body.moduleResources ? JSON.parse(req.body.moduleResources) : [];

        // Map resources to their respective modules
        moduleResources.forEach(resource => {
          const moduleIndex = resource.moduleIndex;
          const resourceFile = resourceFiles.find(file => file.originalname === resource.fileName);

          if (resourceFile && moduleIndex < parsedModules.length) {
            // Initialize resources array if it doesn't exist
            if (!parsedModules[moduleIndex].resources) {
              parsedModules[moduleIndex].resources = [];
            }

            // Add resource to the module
            parsedModules[moduleIndex].resources.push({
              name: resource.name,
              type: resource.type,
              file: resourceFile.path,
              size: resourceFile.size
            });
          }
        });
      }

      // Preserve existing resources if they are not being replaced
      if (req.body.keepExistingResources === 'true') {
        formation.modules.forEach((existingModule, moduleIndex) => {
          if (moduleIndex < parsedModules.length && existingModule.resources && existingModule.resources.length > 0) {
            if (!parsedModules[moduleIndex].resources) {
              parsedModules[moduleIndex].resources = [];
            }

            // Add existing resources that are not being replaced
            existingModule.resources.forEach(resource => {
              // Check if this resource is not being replaced
              const isReplaced = parsedModules[moduleIndex].resources.some(
                newResource => newResource.name === resource.name
              );

              if (!isReplaced) {
                parsedModules[moduleIndex].resources.push(resource);
              }
            });
          }
        });
      }

      updateData.modules = parsedModules;
    }

    const updatedFormation = await Formation.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedFormation
    });
  } catch (error) {
    console.error('Error updating formation:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete a formation
export const deleteFormation = async (req, res) => {
  try {
    const formation = await Formation.findById(req.params.id);

    if (!formation) {
      return res.status(404).json({ success: false, message: 'Formation not found' });
    }

    // Check if the user is the formation creator
    if (formation.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this formation' });
    }

    await Formation.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Formation deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting formation:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get teacher's formations
export const getTeacherFormations = async (req, res) => {
  try {
    const formations = await Formation.find({ teacher: req.user._id });
    res.status(200).json({
      success: true,
      data: formations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
