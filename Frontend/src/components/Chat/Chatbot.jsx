import React, { useState, useEffect, useRef } from 'react';
import './Chatbot.css';

const ChatBubble = ({ sender, message, onClick }) => {
  return (
    <div className={`chat-bubble ${sender}`} onClick={onClick}>
      {message}
    </div>
  );
};

const Chatbot = () => {
  const [messages, setMessages] = useState([
    { sender: 'bot', message: 'Bonjour ! Comment puis-je vous aider aujourd\'hui ?' },
  ]);
  const [userMessage, setUserMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [lastClickedIndex, setLastClickedIndex] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Function to call the AI API
  const callAIAPI = async (userInput) => {
    setIsLoading(true);
    try {
      // Replace with your actual API call
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are a helpful assistant that responds in French." },
            ...messages.map(msg => ({
              role: msg.sender === 'user' ? 'user' : 'assistant',
              content: msg.message
            })),
            { role: "user", content: userInput }
          ],
          temperature: 0.7
        })
      });

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error("Error calling AI API:", error);
      return "Désolé, je n'ai pas pu traiter votre demande. Veuillez réessayer.";
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (userMessage.trim() === '') return;

    // Add user message to chat
    const newUserMessage = { sender: 'user', message: userMessage };
    setMessages(prev => [...prev, newUserMessage]);
    setUserMessage('');

    // Get AI response
    const aiResponse = await callAIAPI(userMessage);
    setMessages(prev => [...prev, { sender: 'bot', message: aiResponse }]);
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
        {isOpen ? '×' : '💬'}
      </button>

      {isOpen && (
        <div className="chat-container">
          <div className="chat-header">
            <h3>Assistant Virtuel</h3>
            <button className="close-chat-button" onClick={handleCloseChat}>
              ×
            </button>
          </div>
          
          <div className="chat-box">
            {messages.map((msg, index) => (
              <ChatBubble
                key={index}
                sender={msg.sender}
                message={msg.message}
                onClick={() => handleBubbleClick(index)}
              />
            ))}
            {isLoading && (
              <div className="chat-bubble bot">
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
              placeholder="Écrivez votre message..."
              disabled={isLoading}
            />
            <button 
              onClick={handleSendMessage}
              disabled={isLoading || !userMessage.trim()}
            >
              {isLoading ? '...' : 'Envoyer'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;