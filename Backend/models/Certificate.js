import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
  // Student who earned the certificate
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Course for which the certificate was issued
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: function() {
      return this.contentType === 'course';
    }
  },
  // Test for which the certificate was issued
  test: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: function() {
      return this.contentType === 'test';
    }
  },
  // Formation for which the certificate was issued
  formation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Formation',
    required: function() {
      return this.contentType === 'formation';
    }
  },
  // Type of content (course, test, formation)
  contentType: {
    type: String,
    enum: ['course', 'test', 'formation'],
    required: true
  },
  // Enrollment associated with this certificate
  enrollment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enrollment',
    required: true
  },
  // Unique certificate ID for verification
  certificateId: {
    type: String,
    required: true,
    unique: true
  },
  // Date when the certificate was issued
  issueDate: {
    type: Date,
    default: Date.now
  },
  // Path to the generated certificate PDF
  certificateUrl: {
    type: String,
    default: '/placeholder.pdf' // Default value instead of required
  },
  // QR code data URL
  qrCodeUrl: {
    type: String,
    required: true
  },
  // Verification URL
  verificationUrl: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

const Certificate = mongoose.model('Certificate', certificateSchema);

export default Certificate;
