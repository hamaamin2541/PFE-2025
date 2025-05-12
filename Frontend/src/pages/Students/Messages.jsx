// Messages.jsx
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import './Messages.css';
import { Card, ListGroup, Form, InputGroup, Button, Badge, Modal } from 'react-bootstrap';
import {
  Search, Mail, Send, Archive, AlertCircle, Star, Trash2, X
} from 'lucide-react';

export const Messages = () => {
  const location = useLocation();
  const [activeFolder, setActiveFolder] = useState('inbox');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // New message modal state
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [newMessage, setNewMessage] = useState({
    recipientId: '',
    subject: '',
    content: ''
  });
  const [teachers, setTeachers] = useState([]);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Check if we were redirected with a teacher ID
  useEffect(() => {
    if (location.state?.teacherId) {
      // Find teacher info and open new message modal
      fetchTeachers(location.state.teacherId);
      setShowNewMessageModal(true);
    }
  }, [location.state]);

  // Fetch messages from API
  const fetchMessages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Vous devez être connecté pour voir vos messages');
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/messages?folder=${activeFolder}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setMessages(response.data.data);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Erreur lors du chargement des messages');
    } finally {
      setLoading(false);
    }
  };

  // Fetch teachers for the new message modal
  const fetchTeachers = async (preselectedTeacherId = null) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/users/byRole/teacher`);

      if (response.data.success) {
        setTeachers(response.data.data);

        // If we have a preselected teacher, set it in the form
        if (preselectedTeacherId) {
          setNewMessage(prev => ({
            ...prev,
            recipientId: preselectedTeacherId
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching teachers:', err);
    }
  };

  // Send a new message
  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.recipientId || !newMessage.subject || !newMessage.content) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    try {
      setSendingMessage(true);
      const token = localStorage.getItem('token');

      const response = await axios.post(`${API_BASE_URL}/api/messages`, newMessage, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        // Close modal and reset form
        setShowNewMessageModal(false);
        setNewMessage({
          recipientId: '',
          subject: '',
          content: ''
        });

        // Refresh messages if we're in the sent folder
        if (activeFolder === 'sent') {
          fetchMessages();
        }
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Erreur lors de l\'envoi du message');
    } finally {
      setSendingMessage(false);
    }
  };

  // Handle input changes for new message form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMessage(prev => ({
      ...prev,
      [name]: value
    }));
  };

  useEffect(() => {
    fetchMessages();
  }, [activeFolder]);

  // Open new message modal and fetch teachers
  const handleNewMessage = () => {
    fetchTeachers();
    setShowNewMessageModal(true);
  };

  const filteredMessages = messages;

  // Add unread messages count calculation
  const unreadCount = messages.filter(msg => !msg.read).length;

  return (
    <div className="messages-container">
      <Card>
        <Card.Body className="p-0">
          <div className="d-flex" style={{ minHeight: '600px' }}>
            {/* Sidebar unique pour les dossiers */}
            <div className="sidebar message-folders">
              <Button
                variant="primary"
                className="w-100 rounded-0 mb-3"
                onClick={handleNewMessage}
              >
                <Send size={16} className="me-2" />
                Nouveau message
              </Button>

              <ListGroup variant="flush">
                <ListGroup.Item
                  action
                  active={activeFolder === 'inbox'}
                  onClick={() => setActiveFolder('inbox')}
                >
                  <Mail size={16} className="me-2" />
                  Boîte de réception
                  {unreadCount > 0 && (
                    <Badge bg="primary" className="ms-2">{unreadCount}</Badge>
                  )}
                </ListGroup.Item>
                <ListGroup.Item
                  action
                  active={activeFolder === 'starred'}
                  onClick={() => setActiveFolder('starred')}
                >
                  <Star size={16} className="me-2" />
                  Favoris
                </ListGroup.Item>
                <ListGroup.Item
                  action
                  active={activeFolder === 'sent'}
                  onClick={() => setActiveFolder('sent')}
                >
                  <Send size={16} className="me-2" />
                  Envoyés
                </ListGroup.Item>
                <ListGroup.Item
                  action
                  active={activeFolder === 'trash'}
                  onClick={() => setActiveFolder('trash')}
                >
                  <Trash2 size={16} className="me-2" />
                  Corbeille
                </ListGroup.Item>
              </ListGroup>
            </div>

            {/* Liste des messages */}
            <div className="message-list border-end" style={{ width: '350px' }}>
              <div className="p-3 border-bottom">
                <InputGroup>
                  <InputGroup.Text>
                    <Search size={16} />
                  </InputGroup.Text>
                  <Form.Control placeholder="Rechercher des messages..." />
                </InputGroup>
              </div>

              {loading ? (
                <div className="text-center p-4 text-muted">
                  <p className="mt-2">Chargement des messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center p-4 text-muted">
                  <Mail size={40} />
                  <p className="mt-2">Votre boîte de réception est vide</p>
                </div>
              ) : (
                <ListGroup variant="flush">
                  {filteredMessages.map(message => (
                    <ListGroup.Item
                      key={message._id}
                      action
                      active={selectedMessage?._id === message._id}
                      onClick={() => setSelectedMessage(message)}
                      className={!message.read ? 'fw-bold' : ''}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          {message.starred && <Star fill="#f4c150" size={14} className="me-1" />}
                          {activeFolder === 'sent'
                            ? `À: ${message.recipient?.fullName || 'Destinataire'}`
                            : `De: ${message.sender?.fullName || 'Expéditeur'}`
                          }
                        </div>
                        <small className="text-muted">
                          {new Date(message.createdAt).toLocaleDateString()}
                        </small>
                      </div>
                      <div className="text-truncate">{message.subject}</div>
                      <div className="text-truncate text-muted small">{message.content}</div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </div>

            {/* Contenu du message sélectionné */}
            <div className="message-content flex-grow-1">
              {selectedMessage ? (
                <div className="p-3">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5>{selectedMessage.subject}</h5>
                    <div>
                      <Button variant="light" size="sm" className="me-2">
                        <Star size={16} />
                      </Button>
                      <Button variant="light" size="sm" className="me-2">
                        <Archive size={16} />
                      </Button>
                      <Button variant="light" size="sm">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="d-flex align-items-center">
                      <div className="avatar me-2">
                        <img
                          src={activeFolder === 'sent'
                            ? `${API_BASE_URL}/${selectedMessage.recipient?.profileImage || 'images/default-profile.jpg'}`
                            : `${API_BASE_URL}/${selectedMessage.sender?.profileImage || 'images/default-profile.jpg'}`
                          }
                          alt="Avatar"
                          className="rounded-circle"
                          width="40"
                          height="40"
                          onError={(e) => {
                            e.target.src = "https://randomuser.me/api/portraits/men/32.jpg";
                          }}
                        />
                      </div>
                      <div>
                        <div>
                          {activeFolder === 'sent'
                            ? selectedMessage.recipient?.fullName || 'Destinataire'
                            : selectedMessage.sender?.fullName || 'Expéditeur'
                          }
                        </div>
                        <small className="text-muted">
                          {activeFolder === 'sent' ? 'De moi' : 'À moi'}
                        </small>
                      </div>
                    </div>
                    <small className="text-muted">
                      {new Date(selectedMessage.createdAt).toLocaleString()}
                    </small>
                  </div>

                  <div className="message-body mb-4">
                    <p>{selectedMessage.content}</p>
                    <p>Cordialement,</p>
                    <p>{activeFolder === 'sent' ? 'Moi' : selectedMessage.sender?.fullName || 'Expéditeur'}</p>
                  </div>

                  <div className="border-top pt-3">
                    <Button variant="primary" className="me-2">
                      <Send size={16} className="me-2" />
                      Répondre
                    </Button>
                    <Button variant="outline-secondary">
                      <AlertCircle size={16} className="me-2" />
                      Signaler
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="d-flex justify-content-center align-items-center h-100">
                  <div className="text-center text-muted">
                    <Mail size={48} className="mb-3" />
                    <h5>Sélectionnez un message pour le lire</h5>
                    <p>Ou composez un nouveau message</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* New Message Modal */}
      <Modal
        show={showNewMessageModal}
        onHide={() => setShowNewMessageModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Nouveau message</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && (
            <div className="alert alert-danger">{error}</div>
          )}
          <Form onSubmit={handleSendMessage}>
            <Form.Group className="mb-3">
              <Form.Label>Destinataire</Form.Label>
              <Form.Select
                name="recipientId"
                value={newMessage.recipientId}
                onChange={handleInputChange}
                required
              >
                <option value="">Sélectionnez un professeur</option>
                {teachers.map(teacher => (
                  <option key={teacher._id} value={teacher._id}>
                    {teacher.fullName}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Sujet</Form.Label>
              <Form.Control
                type="text"
                name="subject"
                value={newMessage.subject}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Message</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                name="content"
                value={newMessage.content}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <div className="d-flex justify-content-end">
              <Button
                variant="secondary"
                className="me-2"
                onClick={() => setShowNewMessageModal(false)}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={sendingMessage}
              >
                {sendingMessage ? 'Envoi en cours...' : 'Envoyer'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Messages;
