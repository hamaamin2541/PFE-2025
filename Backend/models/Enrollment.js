import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // One of these three fields will be populated based on the itemType
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  formation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Formation'
  },
  test: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test'
  },
  // Type of item enrolled in
  itemType: {
    type: String,
    enum: ['course', 'formation', 'test'],
    required: true,
    default: 'course'
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
  }
}, {
  timestamps: true
});

// Create a compound index that includes itemType to ensure a user can only enroll once in each specific item
enrollmentSchema.index(
  { user: 1, itemType: 1, course: 1 },
  { unique: true, sparse: true, partialFilterExpression: { itemType: 'course' } }
);
enrollmentSchema.index(
  { user: 1, itemType: 1, formation: 1 },
  { unique: true, sparse: true, partialFilterExpression: { itemType: 'formation' } }
);
enrollmentSchema.index(
  { user: 1, itemType: 1, test: 1 },
  { unique: true, sparse: true, partialFilterExpression: { itemType: 'test' } }
);

export default mongoose.model('Enrollment', enrollmentSchema);
