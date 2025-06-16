import './Chatbot.css';
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';


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
  const chatEndRef = useRef(null);

  const callAIAPI = async (userInput) => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/gemini/chat`, {
        message: userInput
      });

      if (response.data.success) {
        setErrorCount(0);
        return response.data.data.message.content;
      } else {
        setErrorCount(prev => prev + 1);
        throw new Error('API response was not successful');
      }
    } catch (error) {
      setErrorCount(prev => prev + 1);
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
    const messageToSend = retryMessage || userMessage;
    if (messageToSend.trim() === '') return;

    if (!retryMessage) {
      const newUserMessage = { sender: 'user', message: messageToSend };
      setMessages(prev => [...prev, newUserMessage]);
      setUserMessage('');
    }

    const aiResponse = await callAIAPI(messageToSend);

    const botMessage = {
      sender: 'bot',
      message: aiResponse,
      isError: aiResponse.includes("Désolé, je n'ai pas pu traiter") || aiResponse.includes("difficultés techniques")
    };

    setMessages(prev => [...prev, botMessage]);
    return botMessage.isError;
  };

  const handleRetry = () => {
    const lastUserMessageIndex = [...messages].reverse().findIndex(msg => msg.sender === 'user');
    if (lastUserMessageIndex >= 0) {
      const lastUserMessage = messages[messages.length - 1 - lastUserMessageIndex];
      setMessages(prev => prev.filter((_, i) => i !== prev.length - 1));
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
                />
                <button
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