import mongoose from 'mongoose';
import dotenv from 'dotenv';
import colors from 'colors';

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB Connected'.cyan.underline);
    removeUnusedCollections();
  })
  .catch(err => {
    console.error('MongoDB connection error:'.red.bold, err);
    process.exit(1);
  });

async function removeUnusedCollections() {
  try {
    // Collections to remove
    const collectionsToRemove = ['students', 'teachervideos'];
    
    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    console.log('\nChecking collections to remove:'.yellow.bold);
    
    // Remove each collection if it exists
    for (const collectionName of collectionsToRemove) {
      if (collectionNames.includes(collectionName)) {
        console.log(`- Removing collection: ${collectionName}`.cyan);
        await mongoose.connection.db.dropCollection(collectionName);
        console.log(`  ✓ Collection ${collectionName} removed successfully`.green);
      } else {
        console.log(`- Collection ${collectionName} does not exist, skipping`.yellow);
      }
    }
    
    // Verify collections were removed
    const updatedCollections = await mongoose.connection.db.listCollections().toArray();
    const updatedCollectionNames = updatedCollections.map(c => c.name);
    
    console.log('\nVerifying collections were removed:'.yellow.bold);
    for (const collectionName of collectionsToRemove) {
      if (updatedCollectionNames.includes(collectionName)) {
        console.log(`- ✗ Collection ${collectionName} still exists`.red);
      } else {
        console.log(`- ✓ Collection ${collectionName} was successfully removed`.green);
      }
    }
    
    console.log('\nRemaining collections:'.yellow.bold);
    updatedCollectionNames.forEach(name => {
      console.log(`- ${name}`.green);
    });
    
    // Exit the process
    console.log('\nDone!'.green.bold);
    process.exit(0);
  } catch (error) {
    console.error('Error removing collections:'.red.bold, error);
    process.exit(1);
  }
}
