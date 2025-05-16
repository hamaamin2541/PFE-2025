import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Message content is required']
  },
  read: {
    type: Boolean,
    default: false
  },
  folder: {
    type: String,
    enum: ['inbox', 'sent', 'trash', 'starred'],
    default: 'inbox'
  },
  starred: {
    type: Boolean,
    default: false
  },
  fromAdmin: {
    type: Boolean,
    default: false
  },
  recipientCount: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

export default mongoose.model('Message', messageSchema);
