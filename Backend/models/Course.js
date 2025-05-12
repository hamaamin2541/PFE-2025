import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema({
  name: String,
  type: String,
  file: String,
  size: Number
}, { _id: false });

const sectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  resources: [resourceSchema]
});

const courseSchema = new mongoose.Schema({
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
  price: {
    type: Number,
    required: [true, 'Le prix est requis']
  },
  language: {
    type: String,
    required: [true, 'La langue est requise']
  },
  level: {
    type: String,
    required: [true, 'Le niveau est requis']
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coverImage: {
    type: String
  },
  sections: [sectionSchema],
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  ratings: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    value: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    }
  }],
  views: {
    type: Number,
    default: 0
  },
  enrollments: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    enrolledAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

export default mongoose.model('Course', courseSchema);
