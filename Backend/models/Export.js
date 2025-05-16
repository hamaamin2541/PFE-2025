import mongoose from 'mongoose';

const exportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contentType: {
    type: String,
    enum: ['course', 'test', 'formation', 'report'],
    required: true
  },
  content: {
    type: mongoose.Schema.Types.ObjectId,
    // Use a virtual to handle the reference
    required: function() {
      return this.contentType !== 'report';
    }
  },
  reportType: {
    type: String,
    enum: ['users', 'courses', 'sales', 'complaints'],
    required: function() {
      return this.contentType === 'report';
    }
  },
  exportDate: {
    type: Date,
    default: Date.now
  },
  fileName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    default: 0
  },
  format: {
    type: String,
    enum: ['pdf', 'zip', 'csv', 'xlsx', 'json'],
    default: 'pdf'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  }
}, {
  timestamps: true
});

const Export = mongoose.model('Export', exportSchema);

export default Export;
