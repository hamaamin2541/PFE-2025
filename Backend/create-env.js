import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Path to the .env file
const envPath = path.join(__dirname, '.env');

console.log('=== Creating .env file for your application ===');
console.log(`This file will be created at: ${envPath}`);

// Check if file already exists
if (fs.existsSync(envPath)) {
  console.log('\n⚠️ An .env file already exists!');
  rl.question('Do you want to overwrite it? (y/n): ', (answer) => {
    if (answer.toLowerCase() === 'y') {
      createEnvFile();
    } else {
      console.log('Operation cancelled. Your existing .env file was not modified.');
      rl.close();
    }
  });
} else {
  createEnvFile();
}

function createEnvFile() {
  rl.question('\nEnter your OpenAI API key (starts with sk-): ', (apiKey) => {
    if (!apiKey.trim()) {
      console.log('API key cannot be empty. Please try again.');
      return createEnvFile();
    }

    if (!apiKey.startsWith('sk-')) {
      console.log('\n⚠️ Warning: OpenAI API keys typically start with "sk-". Your key might be invalid.');
      rl.question('Do you want to continue anyway? (y/n): ', (answer) => {
        if (answer.toLowerCase() === 'y') {
          writeEnvFile(apiKey);
        } else {
          createEnvFile();
        }
      });
    } else {
      writeEnvFile(apiKey);
    }
  });
}

function writeEnvFile(apiKey) {
  // Basic .env content
  const envContent = `# Server Configuration
PORT=5001
NODE_ENV=development

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/welearn

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here

# Stripe API Keys
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here

# OpenAI API Key for Nexie AI Assistant
OPENAI_API_KEY=${apiKey}
`;

  try {
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ .env file created successfully!');
    console.log(`File location: ${envPath}`);
    console.log('\nPlease restart your server for the changes to take effect.');
    rl.close();
  } catch (error) {
    console.error('\n❌ Error creating .env file:', error.message);
    rl.close();
  }
}
