# Database and Admin Scripts

This directory contains scripts for database maintenance, updates, and admin account management.

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

## Update Admin Verification Status

The `updateAdminVerification.js` script updates all admin accounts to set their verification status to true, allowing them to log in without requiring email verification.

### How to Run

```bash
# Navigate to the Backend directory
cd Backend

# Run the script
node scripts/updateAdminVerification.js
```

### What the Script Does

1. Connects to the MongoDB database
2. Finds all users with the role 'admin'
3. Updates any admin accounts that are not verified to set `isVerified: true`
4. Displays a summary of the updates made

### When to Run

Run this script if admin users are unable to log in because they're being asked for a verification code. This script ensures all admin accounts are marked as verified.

## Create or Reset Admin Account

The `createAdmin.js` script can be used to create a new admin account or reset an existing admin's password.

### How to Run

```bash
# Navigate to the Backend directory
cd Backend

# Run the script
node scripts/createAdmin.js
```

### What the Script Does

1. Checks if an admin account already exists
2. If an admin exists, it shows the admin's details and offers to reset the password
3. If no admin exists, it creates a new admin account with default credentials:
   - Email: admin@welearn.com
   - Password: admin123
