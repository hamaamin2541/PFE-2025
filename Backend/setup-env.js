import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Path to the .env file
const envPath = path.join(__dirname, '.env');
// Path to the template file
const templatePath = path.join(__dirname, '.env.template');

console.log('=== OpenAI API Key Setup ===');

// Check if .env file already exists
if (fs.existsSync(envPath)) {
  console.log('.env file already exists at:', envPath);
  
  // Read the current file
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Check if OPENAI_API_KEY is already set
  if (envContent.includes('OPENAI_API_KEY=') && !envContent.includes('OPENAI_API_KEY=your_openai_api_key_here')) {
    console.log('OPENAI_API_KEY is already set in your .env file.');
    
    rl.question('Do you want to update it anyway? (y/n): ', (answer) => {
      if (answer.toLowerCase() === 'y') {
        promptForApiKey();
      } else {
        console.log('Keeping existing API key. Setup complete.');
        rl.close();
      }
    });
  } else {
    console.log('OPENAI_API_KEY is not set in your .env file.');
    promptForApiKey();
  }
} else {
  console.log('No .env file found. Creating one from template...');
  
  // Check if template exists
  if (fs.existsSync(templatePath)) {
    // Copy template to .env
    fs.copyFileSync(templatePath, envPath);
    console.log('.env file created from template.');
    promptForApiKey();
  } else {
    console.log('Template file not found. Creating a basic .env file...');
    
    // Create a basic .env file
    const basicEnv = `PORT=5001
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key_here
OPENAI_API_KEY=your_openai_api_key_here
`;
    
    fs.writeFileSync(envPath, basicEnv);
    console.log('Basic .env file created.');
    promptForApiKey();
  }
}

function promptForApiKey() {
  rl.question('Enter your OpenAI API key (starts with sk-): ', (apiKey) => {
    if (!apiKey.trim()) {
      console.log('API key cannot be empty. Please try again.');
      promptForApiKey();
      return;
    }
    
    if (!apiKey.startsWith('sk-')) {
      console.log('Warning: OpenAI API keys typically start with "sk-". Your key might be invalid.');
      rl.question('Do you want to continue anyway? (y/n): ', (answer) => {
        if (answer.toLowerCase() === 'y') {
          updateEnvFile(apiKey);
        } else {
          promptForApiKey();
        }
      });
    } else {
      updateEnvFile(apiKey);
    }
  });
}

function updateEnvFile(apiKey) {
  try {
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Replace the API key
    if (envContent.includes('OPENAI_API_KEY=')) {
      envContent = envContent.replace(/OPENAI_API_KEY=.*/g, `OPENAI_API_KEY=${apiKey}`);
    } else {
      // Add the API key if it doesn't exist
      envContent += `\nOPENAI_API_KEY=${apiKey}\n`;
    }
    
    // Write the updated content back to the file
    fs.writeFileSync(envPath, envContent);
    
    console.log('API key has been updated in your .env file.');
    console.log('Please restart your server for the changes to take effect.');
    rl.close();
  } catch (error) {
    console.error('Error updating .env file:', error);
    rl.close();
  }
}
