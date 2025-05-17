  import mongoose from 'mongoose';
  import bcrypt from 'bcryptjs';

  const userSchema = new mongoose.Schema({
    fullName: {
      type: String,
      required: [true, 'Please provide your name']
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],

      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,

    },
    role: {
      type: String,
      enum: ['student', 'teacher', 'assistant', 'admin'],
      required: true
    },
    studentCard: String,
    teacherId: String,
    profileImage: String,
    enrollments: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Enrollment'
    }],
    specialty: String,
    bio: String,
    phone: String,
    // Gamification fields
    points: {
      type: Number,
      default: 0
    },
    badges: [{
      badgeId: {
        type: String,
        required: true
      },
      name: {
        type: String,
        required: true
      },
      description: String,
      icon: String,
      earnedAt: {
        type: Date,
        default: Date.now
      }
    }],
    // Streak tracking
    streak: {
      currentStreak: {
        type: Number,
        default: 0
      },
      lastActivity: {
        type: Date
      },
      highestStreak: {
        type: Number,
        default: 0
      }
    },
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
      },
      date: {
        type: Date,
        default: Date.now
      }
    }]
  }, {
    timestamps: true
  });

  userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
      next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  });

  export default mongoose.model('User', userSchema);
