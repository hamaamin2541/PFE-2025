import mongoose from 'mongoose';

const ratingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Permettre les notes anonymes
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Méthode statique pour calculer la note moyenne
ratingSchema.statics.getAverageRating = async function() {
  try {
    const result = await this.aggregate([
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          count: { $sum: 1 }
        }
      }
    ]);

    return {
      averageRating: result.length > 0 ? result[0].averageRating : 0,
      totalRatings: result.length > 0 ? result[0].count : 0
    };
  } catch (error) {
    console.error('Erreur lors du calcul de la note moyenne:', error);
    return {
      averageRating: 0,
      totalRatings: 0
    };
  }
};

const Rating = mongoose.model('Rating', ratingSchema);

export default Rating;
