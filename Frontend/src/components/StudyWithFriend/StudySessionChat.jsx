import React, { useState, useEffect, useRef } from 'react';
import { Card, Form, Button } from 'react-bootstrap';
import { Send, MessageSquare } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import './StudySessionChat.css';

const StudySessionChat = ({ sessionId, socket, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch existing messages when component mounts
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/api/study-sessions/${sessionId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.data.success && response.data.data.messages) {
          setMessages(response.data.data.messages);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();
  }, [sessionId]);

  // Socket.io event handlers
  useEffect(() => {
    if (!socket) return;

    // Handle incoming messages
    const handleReceiveMessage = (data) => {
      if (data.sessionId === sessionId) {
        setMessages(prevMessages => [...prevMessages, {
          sender: data.sender,
          content: data.content,
          timestamp: new Date()
        }]);
      }
    };

    // Register event listener
    socket.on('receive-message', handleReceiveMessage);

    return () => {
      // Clean up event listener
      socket.off('receive-message', handleReceiveMessage);
    };
  }, [socket, sessionId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send a new message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      // Send message to the server
      const response = await axios.post(
        `${API_BASE_URL}/api/study-sessions/${sessionId}/messages`,
        { content: newMessage },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        // Emit message to other participants via socket
        if (socket) {
          socket.emit('send-message', {
            sessionId,
            sender: currentUser,
            content: newMessage,
            timestamp: new Date()
          });
        }
        
        // Clear input field
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className="study-session-chat">
      <Card.Header className="d-flex align-items-center">
        <MessageSquare size={18} className="me-2" />
        <span>Discussion en direct</span>
      </Card.Header>
      
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="text-center text-muted p-4">
            <p>Aucun message pour le moment.</p>
            <p>Commencez la discussion avec votre ami!</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div 
              key={index} 
              className={`message ${message.sender._id === currentUser._id ? 'message-sent' : 'message-received'}`}
            >
              <div className="message-content">
                <div className="message-sender">
                  {message.sender._id !== currentUser._id && (
                    <span>{message.sender.fullName}</span>
                  )}
                </div>
                <div className="message-bubble">
                  {message.content}
                </div>
                <div className="message-time">
                  {formatTimestamp(message.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <Card.Footer className="p-2">
        <Form onSubmit={handleSendMessage}>
          <div className="d-flex">
            <Form.Control
              type="text"
              placeholder="Tapez votre message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              variant="primary" 
              className="ms-2"
              disabled={isLoading || !newMessage.trim()}
            >
              <Send size={16} />
            </Button>
          </div>
        </Form>
      </Card.Footer>
    </Card>
  );
};

export default StudySessionChat;
