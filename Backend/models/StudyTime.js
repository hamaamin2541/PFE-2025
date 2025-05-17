import mongoose from 'mongoose';

const studyTimeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // The content being studied
  contentType: {
    type: String,
    enum: ['course', 'test', 'formation'],
    required: true
  },
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'contentType',
    required: true
  },
  // Session timing
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number, // Duration in minutes
    default: 0
  },
  // Week tracking (for easier querying)
  weekNumber: {
    type: Number,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  // Additional metadata
  isActive: {
    type: Boolean,
    default: true
  },
  completedContent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Pre-save hook to calculate duration if endTime is set
studyTimeSchema.pre('save', function(next) {
  if (this.endTime && this.startTime) {
    // Calculate duration in minutes
    const durationMs = this.endTime - this.startTime;
    this.duration = Math.round(durationMs / (1000 * 60));
  }
  next();
});

// Static method to get the current week number and year
studyTimeSchema.statics.getCurrentWeekInfo = function() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now - start;
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  const weekNumber = Math.floor(diff / oneWeek) + 1;
  
  return {
    weekNumber,
    year: now.getFullYear()
  };
};

// Static method to get weekly stats for a user
studyTimeSchema.statics.getWeeklyStats = async function(userId, weekNumber, year) {
  const weekInfo = weekNumber && year 
    ? { weekNumber, year } 
    : this.getCurrentWeekInfo();
  
  const stats = await this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        weekNumber: weekInfo.weekNumber,
        year: weekInfo.year
      }
    },
    {
      $group: {
        _id: null,
        totalMinutes: { $sum: '$duration' },
        sessionsCount: { $sum: 1 },
        completedCount: {
          $sum: { $cond: [{ $eq: ['$completedContent', true] }, 1, 0] }
        }
      }
    }
  ]);
  
  return stats.length > 0 ? stats[0] : {
    totalMinutes: 0,
    sessionsCount: 0,
    completedCount: 0
  };
};

// Static method to get platform average for comparison
studyTimeSchema.statics.getPlatformAverage = async function(weekNumber, year) {
  const weekInfo = weekNumber && year 
    ? { weekNumber, year } 
    : this.getCurrentWeekInfo();
  
  const stats = await this.aggregate([
    {
      $match: {
        weekNumber: weekInfo.weekNumber,
        year: weekInfo.year
      }
    },
    {
      $group: {
        _id: '$user',
        totalMinutes: { $sum: '$duration' }
      }
    },
    {
      $group: {
        _id: null,
        averageMinutes: { $avg: '$totalMinutes' },
        userCount: { $sum: 1 }
      }
    }
  ]);
  
  return stats.length > 0 ? stats[0] : {
    averageMinutes: 0,
    userCount: 0
  };
};

const StudyTime = mongoose.model('StudyTime', studyTimeSchema);

export default StudyTime;
