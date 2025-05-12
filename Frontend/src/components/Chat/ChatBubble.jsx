import React from 'react';
import './Chatbot.css';

const ChatBubble = ({ sender, message }) => {
  return (
    <div className={`chat-bubble ${sender}`}>
      <div className="bubble">{message}</div>
    </div>
  );
};

export default ChatBubble;