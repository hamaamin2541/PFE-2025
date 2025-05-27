import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import './Chatbot.css';

const ChatBubble = ({ sender, message, isError, onClick, onRetry }) => {
  return (
    <div className={`chat-bubble ${sender} ${isError ? 'error' : ''}`} onClick={onClick}>
      {sender === 'bot' && <div className="nexie-avatar"></div>}
      <div className="message-content">{message}</div>
      {isError && sender === 'bot' && (
        <button className="retry-button" onClick={(e) => {
          e.stopPropagation();
          onRetry && onRetry();
        }}>
          Réessayer
        </button>
      )}
    </div>
  );
};

const Chatbot = () => {
  const [messages, setMessages] = useState([
    { sender: 'bot', message: 'Bonjour ! Je suis Nexie, votre assistant virtuel. Comment puis-je vous aider aujourd\'hui ?' },
  ]);
  const [userMessage, setUserMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [lastClickedIndex, setLastClickedIndex] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [apiStatus, setApiStatus] = useState(null);
  const chatEndRef = useRef(null);

  // Function to call the AI API through our backend
  const callAIAPI = async (userInput) => {
    setIsLoading(true);
    try {
      // Convert messages to the format expected by the API
      const messageHistory = messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.message
      }));

      // Add the new user message
      messageHistory.push({ role: 'user', content: userInput });

      console.log('Calling AI API with message history:', messageHistory);

      // Call our backend API
      const response = await axios.post(`${API_BASE_URL}/api/ai/chat`, {
        messages: messageHistory
      });

      console.log('AI API response:', response.data);

      // Check if the response is successful
      if (response.data.success) {
        // Reset error count on successful response
        setErrorCount(0);

        // Check if debug info is available (API key missing)
        if (response.data.debug && response.data.debug.reason === 'API_KEY_MISSING') {
          console.warn('OpenAI API key is missing on the server');
          return response.data.data.message.content;
        }

        return response.data.data.message.content;
      } else {
        // Increment error count
        setErrorCount(prev => prev + 1);
        throw new Error('API response was not successful');
      }
    } catch (error) {
      console.error("Error calling AI API:", error);

      // Increment error count
      setErrorCount(prev => prev + 1);

      // Different messages based on error count
      if (errorCount >= 2) {
        return "Je suis désolé, mais je rencontre des difficultés techniques persistantes. Veuillez contacter notre support technique si le problème persiste.";
      } else {
        return "Désolé, je n'ai pas pu traiter votre demande. Veuillez réessayer dans quelques instants.";
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (retryMessage = null) => {
    // If this is a retry, use the retry message, otherwise use the input field
    const messageToSend = retryMessage || userMessage;

    if (messageToSend.trim() === '') return;

    // If this is not a retry, add the user message to chat
    if (!retryMessage) {
      const newUserMessage = { sender: 'user', message: messageToSend };
      setMessages(prev => [...prev, newUserMessage]);
      setUserMessage('');
    }

    // Get AI response
    const aiResponse = await callAIAPI(messageToSend);

    // Add AI response to chat
    const botMessage = {
      sender: 'bot',
      message: aiResponse,
      isError: aiResponse.includes("Désolé, je n'ai pas pu traiter") || aiResponse.includes("difficultés techniques")
    };

    setMessages(prev => [...prev, botMessage]);

    // If this was an error response, offer a retry button
    return botMessage.isError;
  };

  // Function to retry the last user message
  const handleRetry = () => {
    // Find the last user message
    const lastUserMessageIndex = [...messages].reverse().findIndex(msg => msg.sender === 'user');
    if (lastUserMessageIndex >= 0) {
      const lastUserMessage = messages[messages.length - 1 - lastUserMessageIndex];
      // Remove the error message
      setMessages(prev => prev.filter((_, i) => i !== prev.length - 1));
      // Retry with the last user message
      handleSendMessage(lastUserMessage.message);
    }
  };

  const toggleChat = () => {
    setIsOpen(prev => !prev);
  };

  const handleBubbleClick = (index) => {
    if (lastClickedIndex === index) {
      setMessages(prev => prev.filter((_, i) => i !== index));
      setLastClickedIndex(null);
    } else {
      setUserMessage(messages[index].message);
      setLastClickedIndex(index);
    }
  };

  const handleCloseChat = () => {
    setIsOpen(false);
  };

  // Function to test the OpenAI API connection
  const testOpenAIConnection = async () => {
    try {
      setApiStatus('loading');
      const response = await axios.get(`${API_BASE_URL}/api/ai/test-openai`);
      console.log('OpenAI test response:', response.data);

      if (response.data.success) {
        setApiStatus('success');
        setMessages(prev => [...prev, {
          sender: 'bot',
          message: `✅ Connexion à l'API OpenAI réussie! Réponse: "${response.data.response}"`
        }]);
      } else {
        setApiStatus('error');
        setMessages(prev => [...prev, {
          sender: 'bot',
          message: `❌ Erreur de connexion à l'API OpenAI: ${response.data.message}`,
          isError: true
        }]);
      }
    } catch (error) {
      console.error('Error testing OpenAI connection:', error);
      setApiStatus('error');
      setMessages(prev => [...prev, {
        sender: 'bot',
        message: `❌ Erreur de connexion à l'API OpenAI: ${error.response?.data?.message || error.message}`,
        isError: true
      }]);
    } finally {
      setTimeout(() => setApiStatus(null), 5000);
    }
  };

  // Function to test environment variables
  const testEnvVariables = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/ai/test-env`);
      console.log('Environment test response:', response.data);

      setMessages(prev => [...prev, {
        sender: 'bot',
        message: `Variables d'environnement: ${JSON.stringify(response.data.data, null, 2)}`
      }]);
    } catch (error) {
      console.error('Error testing environment variables:', error);
      setMessages(prev => [...prev, {
        sender: 'bot',
        message: `Erreur lors du test des variables d'environnement: ${error.message}`,
        isError: true
      }]);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="chatbot-wrapper">
      <button className={`chat-button ${isOpen ? 'open' : ''}`} onClick={toggleChat}>
        {isOpen ? '×' : <div className="nexie-button-icon"></div>}
      </button>

      {isOpen && (
        <div className="chat-container">
          <div className="chat-header">
            <div className="nexie-header">
              <div className="nexie-logo"></div>
              <h3>Nexie</h3>
            </div>
            <div className="chat-header-actions">
              <button
                className={`api-test-button ${apiStatus ? apiStatus : ''}`}
                onClick={testOpenAIConnection}
                disabled={apiStatus === 'loading'}
                title="Tester la connexion à l'API OpenAI"
              >
                {apiStatus === 'loading' ? '...' : '🔄'}
              </button>
              <button
                className="env-test-button"
                onClick={testEnvVariables}
                title="Tester les variables d'environnement"
              >
                🔍
              </button>
              <button className="close-chat-button" onClick={handleCloseChat}>
                ×
              </button>
            </div>
          </div>

          <div className="chat-box">
            {messages.map((msg, index) => (
              <ChatBubble
                key={index}
                sender={msg.sender}
                message={msg.message}
                isError={msg.isError}
                onClick={() => handleBubbleClick(index)}
                onRetry={msg.isError ? handleRetry : undefined}
              />
            ))}
            {isLoading && (
              <div className="chat-bubble bot">
                <div className="nexie-avatar"></div>
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="chat-input">
            <input
              type="text"
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Posez une question à Nexie..."
              disabled={isLoading}
            />            <button
              className="send-button"
              onClick={handleSendMessage}
              disabled={isLoading || !userMessage.trim()}
              title="Envoyer"
            >
              {isLoading ? (
                <span className="loading-dots">...</span>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;