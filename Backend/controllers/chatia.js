import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();
const API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyArhEeVDUWq8tXShzW5CGm5N_QTTugkcUY';

export const handleChatIA = async (req, res) => {
    console.log('Received POST request to /api/chat'); // Debug
    try {
        const { message } = req.body;
        console.log('Received message:', message);
        if (!message || typeof message !== 'string') {
            console.error('Invalid message input:', message);
            return res.status(400).json({ success: false, message: 'Un message texte est requis.' });
        }
        const response = await axios.post(
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyArhEeVDUWq8tXShzW5CGm5N_QTTugkcUY',
            {
                contents: [
                    {
                        parts: [{ text: message }]
                    }
                ]
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('Gemini API response:', response.data);
        const aiMessage = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "Je n'ai pas compris votre question.";
        return res.status(200).json({
            success: true,
            data: {
                message: {
                    role: 'assistant',
                    content: aiMessage
                }
            }
        });
    } catch (error) {
        console.error('Erreur IA:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data
        });
        if (error.response?.status === 404) {
            return res.status(400).json({
                success: false,
                message: 'Modèle AI non trouvé. Vérifiez le nom du modèle ou la version de l\'API.',
                error: error.response?.data || error.message
            });
        }
        if (error.response?.status === 403) {
            return res.status(403).json({
                success: false,
                message: 'Clé API non autorisée ou quota dépassé. Vérifiez votre clé API.',
                error: error.response?.data || error.message
            });
        }
        if (error.response?.status === 429) {
            return res.status(429).json({
                success: false,
                message: 'Limite de quota dépassée. Essayez plus tard ou vérifiez votre plan API.',
                error: error.response?.data || error.message
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Erreur lors de la communication avec l\'IA.',
            error: error.response?.data || error.message
        });
    }
};