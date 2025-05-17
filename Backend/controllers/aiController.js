import dotenv from 'dotenv';
dotenv.config();

/**
 * Handle AI chat requests
 * @route POST /api/ai/chat
 * @access Public
 */
export const handleChatRequest = async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        message: 'Messages array is required'
      });
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.log('OpenAI API key is not configured in environment variables');
      // Fallback response if no API key is available
      return res.status(200).json({
        success: true,
        debug: {
          reason: 'API_KEY_MISSING',
          envVars: Object.keys(process.env),
          dotenvLoaded: true
        },
        data: {
          message: {
            role: 'assistant',
            content: "Je suis Nexie, votre assistant virtuel. Je suis actuellement en mode hors ligne. L'équipe travaille à me rendre disponible très bientôt. En attendant, n'hésitez pas à contacter notre support pour toute question."
          }
        }
      });
    }

    console.log('OpenAI API key found, length:', process.env.OPENAI_API_KEY.length);

    // Make request to OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Tu es Nexie, un assistant virtuel intelligent et amical qui répond en français. Tu es spécialisé dans l'aide aux utilisateurs de la plateforme d'apprentissage WeLearn. Tu es toujours poli, serviable et tu fournis des réponses concises mais complètes. Tu peux aider avec la navigation sur le site, les informations sur les cours, et les questions générales sur l'apprentissage en ligne."
          },
          ...messages
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error('OpenAI API error:', data.error);
      return res.status(200).json({
        success: true,
        data: {
          message: {
            role: 'assistant',
            content: "Désolé, je rencontre quelques difficultés techniques en ce moment. Pourriez-vous reformuler votre question ou réessayer dans quelques instants?"
          }
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        message: data.choices[0].message
      }
    });
  } catch (error) {
    console.error('Error in AI controller:', error);
    return res.status(200).json({
      success: true,
      data: {
        message: {
          role: 'assistant',
          content: "Je suis désolé, mais je rencontre des difficultés techniques. Notre équipe travaille à résoudre ce problème. Veuillez réessayer dans quelques instants."
        }
      }
    });
  }
};
