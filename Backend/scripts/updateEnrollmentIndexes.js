import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Enrollment from '../models/Enrollment.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const updateIndexes = async () => {
  try {
    console.log('Starting index update...');
    
    // Get the collection
    const collection = mongoose.connection.collection('enrollments');
    
    // Drop existing indexes (except _id)
    console.log('Dropping existing indexes...');
    const indexes = await collection.indexes();
    for (const index of indexes) {
      if (index.name !== '_id_') {
        await collection.dropIndex(index.name);
        console.log(`Dropped index: ${index.name}`);
      }
    }
    
    // Create new indexes
    console.log('Creating new indexes...');
    
    // Course index
    await collection.createIndex(
      { user: 1, itemType: 1, course: 1 },
      { 
        unique: true, 
        sparse: true,
        partialFilterExpression: { itemType: 'course' },
        name: 'user_itemType_course_unique'
      }
    );
    console.log('Created course index');
    
    // Formation index
    await collection.createIndex(
      { user: 1, itemType: 1, formation: 1 },
      { 
        unique: true, 
        sparse: true,
        partialFilterExpression: { itemType: 'formation' },
        name: 'user_itemType_formation_unique'
      }
    );
    console.log('Created formation index');
    
    // Test index
    await collection.createIndex(
      { user: 1, itemType: 1, test: 1 },
      { 
        unique: true, 
        sparse: true,
        partialFilterExpression: { itemType: 'test' },
        name: 'user_itemType_test_unique'
      }
    );
    console.log('Created test index');
    
    console.log('Index update completed successfully');
  } catch (error) {
    console.error('Error updating indexes:', error);
  } finally {
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

updateIndexes();
