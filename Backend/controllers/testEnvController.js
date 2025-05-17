import dotenv from 'dotenv';
dotenv.config();

export const testEnvVariables = (req, res) => {
  // Don't expose the full API key, just check if it exists and show a few characters
  const openaiKeyExists = !!process.env.OPENAI_API_KEY;
  const openaiKeyPreview = openaiKeyExists 
    ? `${process.env.OPENAI_API_KEY.substring(0, 3)}...${process.env.OPENAI_API_KEY.substring(process.env.OPENAI_API_KEY.length - 3)}`
    : 'Not found';
  
  res.status(200).json({
    success: true,
    data: {
      environment: process.env.NODE_ENV || 'Not set',
      openaiKeyExists,
      openaiKeyPreview,
      dotenvLoaded: true
    }
  });
};
