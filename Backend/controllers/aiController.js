import dotenv from 'dotenv';
dotenv.config();

// Simple fallback responses for when the API key is not available
const fallbackResponses = {
  'bonjour': "Bonjour ! Je suis Nexie, l'assistant virtuel de WeLearn. Comment puis-je vous aider aujourd'hui ?",
  'salut': "Salut ! Je suis Nexie, l'assistant virtuel de WeLearn. Comment puis-je vous aider aujourd'hui ?",
  'hello': "Bonjour ! Je suis Nexie, l'assistant virtuel de WeLearn. Comment puis-je vous aider aujourd'hui ?",
  'aide': "Je peux vous aider avec la navigation sur le site, les informations sur les cours, et les questions générales sur l'apprentissage en ligne.",
  'help': "Je peux vous aider avec la navigation sur le site, les informations sur les cours, et les questions générales sur l'apprentissage en ligne.",
  'cours': "WeLearn propose une variété de cours dans différents domaines. Vous pouvez les explorer dans la section 'Notre Contenu'.",
  'formation': "Les formations sur WeLearn sont des parcours d'apprentissage complets qui regroupent plusieurs cours sur un sujet spécifique.",
  'test': "Les tests sur WeLearn vous permettent d'évaluer vos connaissances et de valider vos compétences.",
  'prix': "Les prix des cours, formations et tests varient en fonction du contenu. Consultez la page de chaque élément pour connaître son prix.",
  'paiement': "WeLearn accepte les paiements par carte bancaire via Stripe, une plateforme de paiement sécurisée.",
  'certificat': "Vous recevez un certificat après avoir complété un cours ou une formation. Vous pouvez les consulter dans la section 'Mes Certificats'.",
  'contact': "Vous pouvez contacter notre équipe via la page Contact ou en envoyant un email à welearneasy01@gmail.com.",
  'merci': "Je vous en prie ! N'hésitez pas si vous avez d'autres questions.",
  'au revoir': "Au revoir ! N'hésitez pas à revenir si vous avez d'autres questions.",
  'bye': "Au revoir ! N'hésitez pas à revenir si vous avez d'autres questions.",
  'comment': "Je vais bien, merci ! Je suis toujours prêt à vous aider avec vos questions sur WeLearn.",
  'qui': "Je suis Nexie, l'assistant virtuel de WeLearn. Je suis là pour vous aider à naviguer sur la plateforme et répondre à vos questions.",
  'dashboard': "Le tableau de bord vous permet de voir vos cours, formations et tests. Vous pouvez y accéder en vous connectant à votre compte.",
  'inscription': "Pour vous inscrire, cliquez sur 'Se Connecter' en haut à droite, puis sur 'Créer un compte'. Vous devrez fournir votre nom, email et créer un mot de passe.",
  'connexion': "Pour vous connecter, cliquez sur 'Se Connecter' en haut à droite et entrez votre email et mot de passe.",
  'mot de passe': "Si vous avez oublié votre mot de passe, cliquez sur 'Mot de passe oublié' sur la page de connexion. Vous recevrez un email pour le réinitialiser.",
  'acheter': "Pour acheter un cours, une formation ou un test, naviguez vers la page du contenu et cliquez sur le bouton 'Acheter'. Vous serez redirigé vers la page de paiement.",
  'étudier': "Vous pouvez étudier à votre rythme sur WeLearn. Les cours sont accessibles 24h/24 et 7j/7.",
  'professeur': "Nos professeurs sont des experts dans leurs domaines. Vous pouvez voir leur profil sur la page 'Nos Professeurs'.",
  'message': "Vous pouvez envoyer des messages aux professeurs et aux autres étudiants via la section 'Messages' de votre tableau de bord.",
  'communauté': "WeLearn dispose d'un mur communautaire où vous pouvez partager vos expériences et interagir avec d'autres apprenants.",
  'problème': "Si vous rencontrez un problème technique, vous pouvez contacter notre support via la page Contact ou en envoyant un email à welearneasy01@gmail.com.",
  'témoignage': "Vous pouvez partager votre expérience sur WeLearn en ajoutant un témoignage. Cela aidera d'autres apprenants à découvrir notre plateforme.",
  'badge': "Vous pouvez gagner des badges en complétant des cours, en passant des tests et en participant activement à la plateforme.",
  'point': "Les points sont attribués lorsque vous complétez des activités sur la plateforme. Ils reflètent votre niveau d'engagement.",
  'statistique': "Vous pouvez voir vos statistiques d'étude hebdomadaires dans votre tableau de bord. Elles vous aident à suivre votre progression.",
  'objectif': "Vous pouvez définir des objectifs d'étude hebdomadaires pour vous motiver à apprendre régulièrement.",
  'assistant': "Les assistants sont des étudiants performants qui peuvent aider d'autres apprenants. Ils ont accès à des fonctionnalités spéciales."
};

// Function to get a fallback response based on user input
const getFallbackResponse = (userMessage) => {
  const lowerCaseMessage = userMessage.toLowerCase();

  // Check for exact matches
  for (const [key, response] of Object.entries(fallbackResponses)) {
    if (lowerCaseMessage.includes(key)) {
      return response;
    }
  }

  // Default response if no match is found
  return "Je suis désolé, je ne peux pas répondre à cette question en mode simulation. Pour activer toutes mes fonctionnalités, veuillez configurer une clé API OpenAI valide.";
};

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

    // Always use fallback responses for now
    console.log('Using fallback responses for chatbot');

    // Get the last user message
    const lastUserMessage = messages[messages.length - 1].content;

    // Get a fallback response based on the user's message
    const responseContent = getFallbackResponse(lastUserMessage);

    // Return the fallback response
    return res.status(200).json({
      success: true,
      debug: {
        mode: 'FALLBACK_RESPONSE',
        userMessage: lastUserMessage
      },
      data: {
        message: {
          role: 'assistant',
          content: responseContent
        }
      }
    });
  } catch (error) {
    console.error('Error in AI controller:', error);

    // Try to get the last user message if available
    let responseContent = "Je suis désolé, mais je rencontre des difficultés techniques. Notre équipe travaille à résoudre ce problème. Veuillez réessayer dans quelques instants.";

    try {
      if (req.body.messages && req.body.messages.length > 0) {
        const lastUserMessage = req.body.messages[req.body.messages.length - 1].content;
        responseContent = getFallbackResponse(lastUserMessage);
      }
    } catch (fallbackError) {
      console.error('Error getting fallback response:', fallbackError);
    }

    return res.status(200).json({
      success: true,
      debug: {
        error: error.message,
        mode: 'ERROR_FALLBACK'
      },
      data: {
        message: {
          role: 'assistant',
          content: responseContent
        }
      }
    });
  }
};
