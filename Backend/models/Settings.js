import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  general: {
    siteName: {
      type: String,
      default: 'WeLearn'
    },
    siteDescription: {
      type: String,
      default: 'Plateforme d\'apprentissage en ligne'
    },
    contactEmail: {
      type: String,
      default: 'contact@welearn.com'
    },
    supportEmail: {
      type: String,
      default: 'support@welearn.com'
    },
    maintenanceMode: {
      type: Boolean,
      default: false
    }
  },
  security: {
    passwordMinLength: {
      type: Number,
      default: 8,
      min: 6,
      max: 32
    },
    passwordRequireUppercase: {
      type: Boolean,
      default: true
    },
    passwordRequireNumber: {
      type: Boolean,
      default: true
    },
    passwordRequireSymbol: {
      type: Boolean,
      default: true
    },
    sessionTimeout: {
      type: Number,
      default: 60,
      min: 5
    },
    maxLoginAttempts: {
      type: Number,
      default: 5,
      min: 1,
      max: 10
    },
    twoFactorAuth: {
      type: Boolean,
      default: false
    }
  },
  notifications: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    adminNewUserNotification: {
      type: Boolean,
      default: true
    },
    adminNewOrderNotification: {
      type: Boolean,
      default: true
    },
    adminNewComplaintNotification: {
      type: Boolean,
      default: true
    },
    userWelcomeEmail: {
      type: Boolean,
      default: true
    },
    userOrderConfirmation: {
      type: Boolean,
      default: true
    },
    userComplaintUpdate: {
      type: Boolean,
      default: true
    }
  },
  email: {
    smtpServer: {
      type: String,
      default: 'smtp.example.com'
    },
    smtpPort: {
      type: Number,
      default: 587
    },
    smtpUsername: {
      type: String,
      default: 'smtp@example.com'
    },
    smtpPassword: {
      type: String,
      default: '********'
    },
    smtpEncryption: {
      type: String,
      default: 'tls',
      enum: ['none', 'ssl', 'tls']
    },
    emailFromName: {
      type: String,
      default: 'WeLearn'
    },
    emailFromAddress: {
      type: String,
      default: 'noreply@welearn.com'
    }
  }
}, {
  timestamps: true
});

// Ensure there's only one settings document
settingsSchema.statics.getSettings = async function() {
  const settings = await this.findOne();
  if (settings) {
    return settings;
  }
  
  // If no settings exist, create default settings
  return await this.create({});
};

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;
