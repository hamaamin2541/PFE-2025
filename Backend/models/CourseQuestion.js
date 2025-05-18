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
  },
  // Track if this answer was provided by an assistant
  isAssistantAnswer: {
    type: Boolean,
    default: false
  },
  // Track if this answer was marked as helpful by the question asker
  isMarkedHelpful: {
    type: Boolean,
    default: false
  },
  // Track when the answer was marked as helpful
  markedHelpfulAt: {
    type: Date
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
  // Track if the question was resolved by an assistant
  resolvedByAssistant: {
    type: Boolean,
    default: false
  },
  // Track response time (in minutes) for the first answer
  firstResponseTime: {
    type: Number
  },
  // Track if an assistant was the first to respond
  firstResponseByAssistant: {
    type: Boolean,
    default: false
  },
  // Track the assistant who claimed this question (if any)
  assignedAssistant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Track when the question was assigned to an assistant
  assignedAt: {
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
