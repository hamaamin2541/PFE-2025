import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Current directory:', __dirname);
console.log('Checking for .env file...');

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('.env file exists at:', envPath);
  
  // Try to read the file content
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    console.log('.env file content length:', envContent.length);
    
    // Check if OPENAI_API_KEY is in the file (without showing the actual key)
    if (envContent.includes('OPENAI_API_KEY=')) {
      console.log('OPENAI_API_KEY found in .env file');
      
      // Show the first few characters of the key
      const match = envContent.match(/OPENAI_API_KEY=(.+)/);
      if (match && match[1]) {
        const key = match[1].trim();
        console.log('API key starts with:', key.substring(0, 5) + '...');
        console.log('API key length:', key.length);
      }
    } else {
      console.log('OPENAI_API_KEY not found in .env file');
    }
  } catch (error) {
    console.error('Error reading .env file:', error);
  }
} else {
  console.log('.env file does NOT exist at:', envPath);
}

// Try loading with dotenv
const result = dotenv.config();
console.log('dotenv.config() result:', result);

// Check if the key is in process.env
if (process.env.OPENAI_API_KEY) {
  console.log('OPENAI_API_KEY is in process.env');
  console.log('Key starts with:', process.env.OPENAI_API_KEY.substring(0, 5) + '...');
  console.log('Key length:', process.env.OPENAI_API_KEY.length);
} else {
  console.log('OPENAI_API_KEY is NOT in process.env');
  console.log('Available environment variables:', Object.keys(process.env).join(', '));
}
