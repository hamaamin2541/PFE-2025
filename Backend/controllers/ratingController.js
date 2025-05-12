import mongoose from 'mongoose';
import Rating from '../models/Rating.js';

// Ajouter une nouvelle note
export const addRating = async (req, res) => {
  try {
    const { userId, rating } = req.body;

    // Vérifier si la note est valide
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'La note doit être comprise entre 1 et 5'
      });
    }

    let ratingValue = Number(rating);
    if (isNaN(ratingValue)) {
      ratingValue = 5; // Valeur par défaut si la conversion échoue
    }

    try {
      // Si l'utilisateur est connecté et a déjà noté, mettre à jour sa note
      if (userId) {
        const existingRating = await Rating.findOne({ userId });

        if (existingRating) {
          existingRating.rating = ratingValue;
          await existingRating.save();
        } else {
          // Créer une nouvelle note
          await Rating.create({ userId, rating: ratingValue });
        }
      } else {
        // Créer une note anonyme
        await Rating.create({ rating: ratingValue });
      }
    } catch (dbError) {
      console.error('Erreur lors de l\'enregistrement de la note dans la base de données:', dbError);
      // Continuer l'exécution pour retourner au moins des statistiques
    }

    // Récupérer les statistiques mises à jour
    let stats;
    try {
      stats = await Rating.getAverageRating();
    } catch (statsError) {
      console.error('Erreur lors de la récupération des statistiques:', statsError);
      stats = { averageRating: 0, totalRatings: 0 };
    }

    return res.status(201).json({
      success: true,
      message: 'Note ajoutée avec succès',
      averageRating: stats.averageRating,
      totalRatings: stats.totalRatings
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la note:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout de la note',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur serveur'
    });
  }
};

// Récupérer les statistiques des notes
export const getRatingStats = async (req, res) => {
  try {
    // Vérifier si la collection Rating existe
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    if (!collectionNames.includes('ratings')) {
      // Si la collection n'existe pas encore, retourner des valeurs par défaut
      return res.status(200).json({
        success: true,
        averageRating: 0,
        totalRatings: 0
      });
    }

    const stats = await Rating.getAverageRating();

    return res.status(200).json({
      success: true,
      averageRating: stats.averageRating,
      totalRatings: stats.totalRatings
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    // Retourner des valeurs par défaut en cas d'erreur
    return res.status(200).json({
      success: true,
      averageRating: 0,
      totalRatings: 0,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
