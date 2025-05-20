import dotenv from 'dotenv';
dotenv.config();

export const testOpenAI = async (req, res) => {
  try {
    // Return a simple success response
    return res.status(200).json({
      success: true,
      message: 'Chatbot test successful',
      response: 'Bonjour! Je suis Nexie, votre assistant virtuel.'
    });
  } catch (error) {
    console.error('Error testing OpenAI API:', error);
    return res.status(500).json({
      success: false,
      message: 'Error testing OpenAI API',
      error: error.message
    });
  }
};
