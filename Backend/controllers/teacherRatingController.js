import User from '../models/User.js';

// Ajouter ou mettre à jour une note pour un professeur
export const rateTeacher = async (req, res) => {
  try {
    const { teacherId, rating } = req.body;
    const userId = req.user._id;

    // Vérifier si la note est valide
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'La note doit être comprise entre 1 et 5'
      });
    }

    // Vérifier si le professeur existe
    const teacher = await User.findOne({ _id: teacherId, role: 'teacher' });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Professeur non trouvé'
      });
    }

    // Vérifier que l'utilisateur ne se note pas lui-même
    if (userId.toString() === teacherId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas vous noter vous-même'
      });
    }

    // Vérifier si l'utilisateur a déjà noté ce professeur
    const existingRatingIndex = teacher.ratings.findIndex(
      r => r.user.toString() === userId.toString()
    );

    if (existingRatingIndex !== -1) {
      // Mettre à jour la note existante
      teacher.ratings[existingRatingIndex].value = rating;
      teacher.ratings[existingRatingIndex].date = Date.now();
    } else {
      // Ajouter une nouvelle note
      teacher.ratings.push({
        user: userId,
        value: rating,
        date: Date.now()
      });
    }

    await teacher.save();

    // Calculer la note moyenne
    const averageRating = teacher.ratings.reduce((acc, curr) => acc + curr.value, 0) / teacher.ratings.length;

    res.status(200).json({
      success: true,
      message: 'Note ajoutée avec succès',
      data: {
        averageRating: averageRating.toFixed(1),
        totalRatings: teacher.ratings.length
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la note:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout de la note',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur serveur'
    });
  }
};

// Obtenir les notes d'un professeur
export const getTeacherRatings = async (req, res) => {
  try {
    const { teacherId } = req.params;

    // Vérifier si le professeur existe
    const teacher = await User.findOne({ _id: teacherId, role: 'teacher' })
      .populate('ratings.user', 'fullName profileImage');

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Professeur non trouvé'
      });
    }

    // Calculer la note moyenne
    const averageRating = teacher.ratings.length > 0
      ? teacher.ratings.reduce((acc, curr) => acc + curr.value, 0) / teacher.ratings.length
      : 0;

    // Vérifier si l'utilisateur connecté a déjà noté ce professeur
    let userRating = null;
    if (req.user) {
      const userRatingObj = teacher.ratings.find(
        r => r.user._id.toString() === req.user._id.toString()
      );
      if (userRatingObj) {
        userRating = userRatingObj.value;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        ratings: teacher.ratings,
        averageRating: averageRating.toFixed(1),
        totalRatings: teacher.ratings.length,
        userRating
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des notes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des notes',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur serveur'
    });
  }
};

// Obtenir la note moyenne d'un professeur
export const getTeacherAverageRating = async (req, res) => {
  try {
    const { teacherId } = req.params;

    // Vérifier si le professeur existe
    const teacher = await User.findOne({ _id: teacherId, role: 'teacher' });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Professeur non trouvé'
      });
    }

    // Calculer la note moyenne
    const averageRating = teacher.ratings.length > 0
      ? teacher.ratings.reduce((acc, curr) => acc + curr.value, 0) / teacher.ratings.length
      : 0;

    res.status(200).json({
      success: true,
      data: {
        averageRating: averageRating.toFixed(1),
        totalRatings: teacher.ratings.length
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la note moyenne:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la note moyenne',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur serveur'
    });
  }
};
