import mongoose from 'mongoose';
import dotenv from 'dotenv';
import colors from 'colors';

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB Connected'.cyan.underline);
    listCollections();
  })
  .catch(err => {
    console.error('MongoDB connection error:'.red.bold, err);
    process.exit(1);
  });

async function listCollections() {
  try {
    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    console.log('\nDatabase Collections:'.yellow.bold);
    collections.forEach(collection => {
      console.log(`- ${collection.name}`.green);
    });
    
    // Check if students and teachervideos collections exist
    const studentsExists = collections.some(c => c.name === 'students');
    const teachervideosExists = collections.some(c => c.name === 'teachervideos');
    
    console.log('\nSpecific Collections:'.yellow.bold);
    console.log(`- students: ${studentsExists ? 'Exists'.green : 'Does not exist'.red}`);
    console.log(`- teachervideos: ${teachervideosExists ? 'Exists'.green : 'Does not exist'.red}`);
    
    // If they exist, check if they're empty
    if (studentsExists) {
      const studentsCount = await mongoose.connection.db.collection('students').countDocuments();
      console.log(`  - students collection has ${studentsCount} documents`.cyan);
    }
    
    if (teachervideosExists) {
      const teachervideosCount = await mongoose.connection.db.collection('teachervideos').countDocuments();
      console.log(`  - teachervideos collection has ${teachervideosCount} documents`.cyan);
    }
    
    // Exit the process
    console.log('\nDone!'.green.bold);
    process.exit(0);
  } catch (error) {
    console.error('Error listing collections:'.red.bold, error);
    process.exit(1);
  }
}
