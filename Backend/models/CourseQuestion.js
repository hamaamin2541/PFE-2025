import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  isInappropriate: {
    type: Boolean,
    default: false
  },
  inappropriateReason: {
    type: String
  }
}, { _id: true });

const courseQuestionSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Le titre de la question est requis'],
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Le contenu de la question est requis']
  },
  answers: [answerSchema],
  isResolved: {
    type: Boolean,
    default: false
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: {
    type: Date
  },
  isInappropriate: {
    type: Boolean,
    default: false
  },
  inappropriateReason: {
    type: String
  },
  section: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course.sections'
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

export default mongoose.model('CourseQuestion', courseQuestionSchema);
