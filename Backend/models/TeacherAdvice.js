import mongoose from 'mongoose';

const teacherAdviceSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Content is required']
  },
  type: {
    type: String,
    enum: ['text', 'video'],
    required: true
  },
  videoPath: {
    type: String,
    required: function() {
      return this.type === 'video';
    }
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
},
 {
  timestamps: true
});

export default mongoose.model('TeacherAdvice', teacherAdviceSchema);
