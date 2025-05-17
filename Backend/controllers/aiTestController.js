import dotenv from 'dotenv';
dotenv.config();

export const testOpenAI = async (req, res) => {
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return res.status(400).json({
        success: false,
        message: 'OpenAI API key is not configured in environment variables',
        envVars: Object.keys(process.env)
      });
    }
    
    // Make a simple request to OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: "Say hello in French" }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();
    
    if (data.error) {
      return res.status(400).json({
        success: false,
        message: 'OpenAI API returned an error',
        error: data.error
      });
    }

    return res.status(200).json({
      success: true,
      message: 'OpenAI API test successful',
      response: data.choices[0].message.content
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
