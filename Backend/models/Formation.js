import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['video', 'pdf', 'document', 'image', 'audio', 'other']
  },
  file: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    default: 0
  }
}, { _id: false });

const moduleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  resources: {
    type: [resourceSchema],
    default: []
  }
}, { _id: false });

const formationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Le titre est requis'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'La description est requise']
  },
  category: {
    type: String,
    required: [true, 'La catégorie est requise']
  },
  price: {
    type: Number,
    required: [true, 'Le prix est requis']
  },
  duration: {
    type: String,
    required: [true, 'La durée est requise']
  },
  level: {
    type: String,
    required: [true, 'Le niveau est requis'],
    enum: ['Débutant', 'Intermédiaire', 'Avancé', 'Expert'],
    default: 'Débutant'
  },
  language: {
    type: String,
    required: [true, 'La langue est requise'],
    default: 'Français'
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coverImage: {
    type: String
  },
  modules: {
    type: [moduleSchema],
    required: [true, 'Au moins un module est requis'],
    validate: {
      validator: function(modules) {
        return modules.length > 0;
      },
      message: 'La formation doit contenir au moins un module'
    }
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

export default mongoose.model('Formation', formationSchema);
