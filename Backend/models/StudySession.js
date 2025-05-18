import mongoose from 'mongoose';

const studySessionSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: function() {
      return !this.formation; // Course is required only if formation is not provided
    }
  },
  formation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Formation',
    required: function() {
      return !this.course; // Formation is required only if course is not provided
    }
  },
  contentType: {
    type: String,
    enum: ['course', 'formation'],
    required: true,
    default: 'course'
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  guest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'cancelled'],
    default: 'pending'
  },
  inviteToken: {
    type: String,
    required: true
  },
  inviteExpires: {
    type: Date,
    required: true,
    default: function() {
      // Default expiration is 24 hours from creation
      return new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
  },
  currentTime: {
    type: Number,
    default: 0
  },
  isPlaying: {
    type: Boolean,
    default: false
  },
  lastSyncTime: {
    type: Date,
    default: Date.now
  },
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  scheduledTime: {
    type: Date
  }
}, {
  timestamps: true
});

export default mongoose.model('StudySession', studySessionSchema);
