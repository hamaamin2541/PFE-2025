import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Course from './models/Course.js';
import connectDB from './config/db.js';

dotenv.config();
connectDB();

const courses = [
  // Développement Web
  {
    title: "Web Development Fundamentals",
    description: "Learn the basics of web development including HTML, CSS, and JavaScript",
    category: "Développement Web",
    price: 299,
    language: "Français",
    level: "Débutant",
    thumbnail: "webdev.jpg",
    instructor: "64f1c2e4b5d3c2a1b2c3d4e5", // Replace with a valid instructor ID
  },
  {
    title: "React Masterclass",
    description: "Become a React expert with advanced concepts and real-world projects",
    category: "Développement Web",
    price: 349,
    language: "Français",
    level: "Intermédiaire",
    thumbnail: "react.jpg",
    instructor: "64f1c2e4b5d3c2a1b2c3d4e5",
  },

  // Développement Mobile
  {
    title: "Flutter App Development",
    description: "Build cross-platform mobile apps with Flutter and Dart",
    category: "Développement Mobile",
    price: 329,
    language: "Français",
    level: "Débutant",
    thumbnail: "flutter.jpg",
    instructor: "64f1c2e4b5d3c2a1b2c3d4e5",
  },

  // Systèmes d'Information
  {
    title: "Information Systems Management",
    description: "Master the fundamentals of IS management",
    category: "Systèmes d'Information",
    price: 399,
    language: "Français",
    level: "Intermédiaire",
    thumbnail: "ism.jpg",
    instructor: "64f1c2e4b5d3c2a1b2c3d4e5",
  },

  // Intelligence Artificielle
  {
    title: "Machine Learning Fundamentals",
    description: "Learn the basics of machine learning with Python and scikit-learn",
    category: "Intelligence Artificielle",
    price: 379,
    language: "Français",
    level: "Intermédiaire",
    thumbnail: "ml.jpg",
    instructor: "64f1c2e4b5d3c2a1b2c3d4e5",
  },

  // Certifications Informatiques
  {
    title: "AWS Cloud Practitioner Certification",
    description: "Prepare for the AWS Cloud Practitioner certification exam",
    category: "Certifications Informatiques",
    price: 249,
    language: "Français",
    level: "Débutant",
    thumbnail: "aws.jpg",
    instructor: "64f1c2e4b5d3c2a1b2c3d4e5",
  },

  // Design & UX
  {
    title: "UI/UX Design Principles",
    description: "Learn the fundamentals of UI/UX design with Figma",
    category: "Design & UX",
    price: 299,
    language: "Français",
    level: "Débutant",
    thumbnail: "uiux.jpg",
    instructor: "64f1c2e4b5d3c2a1b2c3d4e5",
  },

  // Marketing Digital
  {
    title: "SEO Masterclass",
    description: "Learn how to optimize your website for search engines",
    category: "Marketing Digital",
    price: 279,
    language: "Français",
    level: "Débutant",
    thumbnail: "seo.jpg",
    instructor: "64f1c2e4b5d3c2a1b2c3d4e5",
  },

  // Business & Entrepreneuriat
  {
    title: "Startup Fundamentals",
    description: "Learn how to launch and grow your startup",
    category: "Business & Entrepreneuriat",
    price: 349,
    language: "Français",
    level: "Débutant",
    thumbnail: "startup.jpg",
    instructor: "64f1c2e4b5d3c2a1b2c3d4e5",
  },

  // Leadership
  {
    title: "Effective Team Management",
    description: "Learn how to lead and manage teams effectively",
    category: "Leadership",
    price: 299,
    language: "Français",
    level: "Intermédiaire",
    thumbnail: "leadership.jpg",
    instructor: "64f1c2e4b5d3c2a1b2c3d4e5",
  },

  // Langues
  {
    title: "Business English",
    description: "Improve your English skills for professional environments",
    category: "Langues",
    price: 249,
    language: "Français",
    level: "Intermédiaire",
    thumbnail: "english.jpg",
    instructor: "64f1c2e4b5d3c2a1b2c3d4e5",
  }
];

const importData = async () => {
  try {
    // Clear existing courses only
    await Course.deleteMany();

    // Import courses (instructor will be set when teacher creates course)
    await Course.create(courses);

    console.log('Courses Imported Successfully!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await Course.deleteMany();
    console.log('Courses Destroyed!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error}`);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}
