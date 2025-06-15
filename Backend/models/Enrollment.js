import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',

  },
  formation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Formation',
  },
  test: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
  },
  itemType: {
    type: String,
    enum: ['course', 'formation', 'test'],
    required: true
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  lastAccessDate: {
    type: Date,
    default: Date.now
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused'],
    default: 'active'
  },
  completedSections: {
    type: [Number], // Array of section indices that have been completed
    default: []
  },
  completionDate: {
    type: Date
  },
  certificate: {
    issued: {
      type: Boolean,
      default: false
    },
    issueDate: {
      type: Date
    },
    certificateUrl: {
      type: String
    }
  },
  notes: {
    type: String
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'completed'
  },
  paymentMethod: {
    type: String
  },
  transactionId: {
    type: String
  },
  amount: {
    type: Number
  }
}, {
  timestamps: true
});



const Enrollment = mongoose.model('Enrollment', enrollmentSchema);

export default Enrollment;
