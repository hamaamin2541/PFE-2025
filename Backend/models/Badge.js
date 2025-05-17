import mongoose from 'mongoose';

const badgeSchema = new mongoose.Schema({
  badgeId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['course', 'quiz', 'streak', 'achievement'],
    required: true
  },
  criteria: {
    type: {
      type: String,
      enum: ['course_completion', 'quiz_completion', 'streak', 'course_count', 'quiz_count'],
      required: true
    },
    threshold: {
      type: Number,
      required: true
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test'
    }
  },
  pointsAwarded: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Badge', badgeSchema);
