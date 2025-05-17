import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Badge from '../models/Badge.js';
import colors from 'colors';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Connect to MongoDB
const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!mongoURI) {
  console.error('MongoDB URI is not defined in environment variables. Please check your .env file.'.red.bold);
  process.exit(1);
}

mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB Connected'.cyan.underline))
  .catch(err => {
    console.error(`Error: ${err.message}`.red.bold);
    process.exit(1);
  });

// Default badges
const defaultBadges = [
  // Course completion badges
  {
    badgeId: 'first_course',
    name: 'Premier Cours',
    description: 'Terminer votre premier cours',
    icon: 'graduation-cap',
    category: 'achievement',
    criteria: {
      type: 'course_count',
      threshold: 1
    },
    pointsAwarded: 50
  },
  {
    badgeId: 'course_master',
    name: 'Maître des Cours',
    description: 'Terminer 5 cours',
    icon: 'book',
    category: 'achievement',
    criteria: {
      type: 'course_count',
      threshold: 5
    },
    pointsAwarded: 100
  },
  {
    badgeId: 'course_expert',
    name: 'Expert des Cours',
    description: 'Terminer 10 cours',
    icon: 'award',
    category: 'achievement',
    criteria: {
      type: 'course_count',
      threshold: 10
    },
    pointsAwarded: 200
  },

  // Quiz completion badges
  {
    badgeId: 'first_quiz',
    name: 'Premier Quiz',
    description: 'Terminer votre premier quiz',
    icon: 'check-circle',
    category: 'achievement',
    criteria: {
      type: 'quiz_count',
      threshold: 1
    },
    pointsAwarded: 30
  },
  {
    badgeId: 'quiz_master',
    name: 'Maître des Quiz',
    description: 'Terminer 5 quiz',
    icon: 'check-square',
    category: 'achievement',
    criteria: {
      type: 'quiz_count',
      threshold: 5
    },
    pointsAwarded: 80
  },

  // Streak badges
  {
    badgeId: 'three_day_streak',
    name: 'Série de 3 Jours',
    description: 'Se connecter 3 jours consécutifs',
    icon: 'calendar',
    category: 'streak',
    criteria: {
      type: 'streak',
      threshold: 3
    },
    pointsAwarded: 30
  },
  {
    badgeId: 'week_streak',
    name: 'Série Hebdomadaire',
    description: 'Se connecter 7 jours consécutifs',
    icon: 'calendar-check',
    category: 'streak',
    criteria: {
      type: 'streak',
      threshold: 7
    },
    pointsAwarded: 70
  },
  {
    badgeId: 'month_streak',
    name: 'Série Mensuelle',
    description: 'Se connecter 30 jours consécutifs',
    icon: 'flame',
    category: 'streak',
    criteria: {
      type: 'streak',
      threshold: 30
    },
    pointsAwarded: 300
  }
];

// Function to initialize badges
const initBadges = async () => {
  try {
    // Delete existing badges
    await Badge.deleteMany({});
    console.log('Existing badges deleted'.yellow);

    // Insert default badges
    await Badge.insertMany(defaultBadges);
    console.log(`${defaultBadges.length} badges inserted`.green);

    console.log('Badge initialization complete'.cyan);
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`.red.bold);
    process.exit(1);
  }
};

// Run the initialization
initBadges();
