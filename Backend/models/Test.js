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

const answerSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  }
}, { _id: false });

const questionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  answers: [answerSchema],
  correctAnswer: {
    type: Number,
    required: true
  }
}, { _id: false });

const testSchema = new mongoose.Schema({
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
  duration: {
    type: Number,
    required: [true, 'La durée est requise'],
    default: 30
  },
  difficulty: {
    type: String,
    required: [true, 'Le niveau de difficulté est requis'],
    enum: ['Débutant', 'Intermédiaire', 'Avancé', 'Expert'],
    default: 'Débutant'
  },
  price: {
    type: Number,
    required: [true, 'Le prix est requis'],
    default: 0
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coverImage: {
    type: String
  },
  resources: {
    type: [resourceSchema],
    default: []
  },
  questions: {
    type: [questionSchema],
    required: [true, 'Au moins une question est requise'],
    validate: {
      validator: function(questions) {
        return questions.length > 0;
      },
      message: 'Le test doit contenir au moins une question'
    }
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    score: {
      type: Number,
      default: 0
    },
    completedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

export default mongoose.model('Test', testSchema);
