# Database Scripts

This directory contains scripts for database maintenance and updates.

## Update Enrollment Indexes

The `updateEnrollmentIndexes.js` script updates the indexes on the Enrollment collection to fix issues with duplicate key errors when enrolling in different item types (courses, formations, tests).

### How to Run

1. Make sure your MongoDB server is running
2. Navigate to the Backend directory
3. Run the script using Node.js:

```bash
node scripts/updateEnrollmentIndexes.js
```

### What the Script Does

1. Connects to the MongoDB database
2. Drops all existing indexes on the enrollments collection (except the _id index)
3. Creates new compound indexes that include the itemType field
4. Uses partialFilterExpression to ensure uniqueness only applies within each item type

### When to Run

Run this script after updating the Enrollment model to fix the duplicate key error when enrolling in formations or tests.

## Troubleshooting

If you encounter any issues:

1. Make sure your MongoDB connection string is correct in your .env file
2. Check that you have the necessary permissions to modify indexes
3. If errors persist, you may need to manually drop the indexes using MongoDB Compass or the mongo shell
