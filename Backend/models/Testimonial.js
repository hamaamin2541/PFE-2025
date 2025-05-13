import mongoose from 'mongoose';

const testimonialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true
  },
  role: {
    type: String,
    required: [true, 'Le rôle est requis'],
    trim: true
  },
  message: {
    type: String,
    required: [true, 'Le message est requis'],
    trim: true
  },
  rating: {
    type: Number,
    required: [true, 'La note est requise'],
    min: 1,
    max: 5
  },
  // Si l'utilisateur est connecté, on peut stocker son ID
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  // Statut d'approbation (pour modération)
  approved: {
    type: Boolean,
    default: false
  },
  // Avatar (optionnel)
  avatar: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

export default mongoose.model('Testimonial', testimonialSchema);
