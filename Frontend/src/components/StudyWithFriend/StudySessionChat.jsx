import './StudySessionChat.css';
import React, { useState, useEffect, useRef } from 'react';
import { Card, Form, Button } from 'react-bootstrap';
import { Send, MessageSquare } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import { FaPaperPlane } from "react-icons/fa";

const StudySessionChat = ({ sessionId, socket, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [guest, setGuest] = useState("");
  const [host, setHost] = useState("");
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const studentData = JSON.parse(localStorage.getItem('studentData'));


  const studentDataString = localStorage.getItem('studentData'); // Get the JSON string
  //  // Parse it to an object

  console.log(studentData.fullName); // Logs "aaaaaaaa"

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
        console.log('Fetched messages:', response.data); 
              
        if (response.data.success && response.data.data.messages) {
          const guest = response.data.data.guest;
          const host = response.data.data.host;
          const currentUser = localStorage.getItem('studentData');
          if (currentUser === guest.fullName) {
            setGuest(host);
            setHost(guest);
          }
          else{
            setGuest(guest);
            setHost(host);
          }
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
      const name = localStorage.getItem('studentData');
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
            sender: studentData._id,
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
    <div className="study-session-chat">
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="text-center text-muted p-4">
            <p>Aucun message pour le moment.</p>
            <p>Commencez la discussion avec votre ami!</p>
          </div>
        ) : (
          messages.map((  message, index) => {
            // Add null checks to prevent errors
            console.log('Message:', message);
            const isCurrentUser = guest._id === message.sender || (host._id === currentUser._id && guest._id === currentUser._id);
            const senderName = guest.fullName;
            console.log(host.fullName);

            
            return (
              <div
                key={index}
                className={`message ${isCurrentUser ? 'message-sent' : 'message-received'}`}
              >
                
                  <div className="message-sender">
                    {isCurrentUser ?  (
                      <span>{studentData.fullName}</span>
                    ) : (
                      <span>{host.fullName}</span>
                    )}
                  </div>
                  <div className="message-bubble">
                    {message.content || ''}
                  </div>
                  <div className="message-time">
                    {formatTimestamp(message.timestamp || new Date())}
                  </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <Form onSubmit={handleSendMessage} className="w-100 d-flex">
            <Form.Control
                id="message-input"
                type="text"
                placeholder="Tapez votre message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={isLoading}
                className="chat-input"
                autoComplete="off"
            />
            <Button
                type="submit"
                variant="primary"
                className="send-button"
                disabled={isLoading || !newMessage.trim()}
            >
                <FaPaperPlane />
            </Button>
        </Form>
      </div>
    </div>
  );
};

export default StudySessionChat;
