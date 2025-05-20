import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to routes directory
const routesDir = path.join(__dirname, '..', 'routes');

// Get all JS files in the routes directory
const routeFiles = fs.readdirSync(routesDir)
  .filter(file => file.endsWith('.js'))
  .map(file => path.join(routesDir, file));

console.log(`Found ${routeFiles.length} route files to process`);

// Process each file
let updatedFiles = 0;

routeFiles.forEach(filePath => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if the file imports from auth.js
    if (content.includes("from '../middleware/auth.js'")) {
      // Replace the import
      const updatedContent = content.replace(
        "from '../middleware/auth.js'", 
        "from '../middleware/authMiddleware.js'"
      );
      
      // Write the updated content back to the file
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      updatedFiles++;
      console.log(`Updated imports in ${path.basename(filePath)}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
});

console.log(`\nUpdate complete. Modified ${updatedFiles} files.`);
