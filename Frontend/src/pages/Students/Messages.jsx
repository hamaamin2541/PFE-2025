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

export const Messages = ({ teacherId }) => {
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
  const [students, setStudents] = useState([]);
  const [recipientType, setRecipientType] = useState('teacher');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Check if we were redirected with a teacher ID (from props or location state)
  useEffect(() => {
    // First check the prop (passed from DashboardStudent)
    if (teacherId) {
      // Find teacher info and open new message modal
      fetchTeachers(teacherId);
      setRecipientType('teacher');
      setShowNewMessageModal(true);
    }
    // Then check location state (for direct navigation)
    else if (location.state?.teacherId) {
      // Find teacher info and open new message modal
      fetchTeachers(location.state.teacherId);
      setRecipientType('teacher');
      setShowNewMessageModal(true);
    }

    // Check if we were redirected with a student ID
    if (location.state?.studentId) {
      // Find student info and open new message modal
      fetchStudents(location.state.studentId);
      setRecipientType('student');
      setShowNewMessageModal(true);
    }

    // Check if we were redirected with a conversation ID
    if (location.state?.conversationId) {
      // Find the conversation and select it
      fetchConversation(location.state.conversationId);
    }
  }, [location.state, teacherId]);

  // Fetch a specific conversation by ID
  const fetchConversation = async (conversationId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Vous devez être connecté pour voir vos messages');
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/messages/${conversationId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success && response.data.data) {
        // Set the selected message
        setSelectedMessage(response.data.data);

        // Also fetch all messages to populate the list
        fetchMessages();
      }
    } catch (err) {
      console.error('Error fetching conversation:', err);
      setError('Erreur lors du chargement de la conversation');
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages from API with debounce
  const fetchMessages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Vous devez être connecté pour voir vos messages');
        setLoading(false);
        return;
      }

      // Utiliser un cache pour éviter de recharger les mêmes données
      const cachedMessages = sessionStorage.getItem(`messages_${activeFolder}`);
      const cacheTimestamp = sessionStorage.getItem(`messages_${activeFolder}_timestamp`);

      // Vérifier si nous avons un cache récent (moins de 5 minutes)
      const now = Date.now();
      const cacheAge = cacheTimestamp ? now - parseInt(cacheTimestamp) : Infinity;
      const cacheValid = cacheAge < 5 * 60 * 1000; // 5 minutes

      if (cachedMessages && cacheValid) {
        setMessages(JSON.parse(cachedMessages));
        setLoading(false);

        // Rafraîchir en arrière-plan
        refreshMessagesInBackground();
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/messages?folder=${activeFolder}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        const messagesData = response.data.data;
        setMessages(messagesData);
        setError(null);

        // Mettre en cache les résultats
        sessionStorage.setItem(`messages_${activeFolder}`, JSON.stringify(messagesData));
        sessionStorage.setItem(`messages_${activeFolder}_timestamp`, now.toString());
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Erreur lors du chargement des messages');
    } finally {
      setLoading(false);
    }
  };

  // Rafraîchir les messages en arrière-plan sans bloquer l'interface
  const refreshMessagesInBackground = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_BASE_URL}/api/messages?folder=${activeFolder}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        const messagesData = response.data.data;
        setMessages(messagesData);

        // Mettre à jour le cache
        sessionStorage.setItem(`messages_${activeFolder}`, JSON.stringify(messagesData));
        sessionStorage.setItem(`messages_${activeFolder}_timestamp`, Date.now().toString());
      }
    } catch (err) {
      console.error('Error refreshing messages in background:', err);
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

  // Fetch students for the new message modal
  const fetchStudents = async (preselectedStudentId = null) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/users/byRole/student`);

      if (response.data.success) {
        setStudents(response.data.data);

        // If we have a preselected student, set it in the form
        if (preselectedStudentId) {
          setNewMessage(prev => ({
            ...prev,
            recipientId: preselectedStudentId
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching students:', err);
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

        // If the message was sent successfully and we have the new message data
        if (response.data.data) {
          // Set the sent message as the selected message
          setSelectedMessage(response.data.data);

          // Switch to sent folder to show the message
          setActiveFolder('sent');
        }

        // Reset the form
        setNewMessage({
          recipientId: '',
          subject: '',
          content: ''
        });

        // Refresh messages to update the list
        fetchMessages();
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

  // Utiliser un effet avec une dépendance sur activeFolder
  useEffect(() => {
    // Utiliser une référence pour éviter les appels inutiles
    const controller = new AbortController();

    const loadMessages = async () => {
      await fetchMessages();
    };

    loadMessages();

    // Nettoyage en cas de changement de dossier avant la fin du chargement
    return () => {
      controller.abort();
    };
  }, [activeFolder]);

  // Open new message modal and fetch recipients
  const handleNewMessage = () => {
    fetchTeachers();
    fetchStudents();
    setShowNewMessageModal(true);
  };

  // Handle recipient type change
  const handleRecipientTypeChange = (type) => {
    setRecipientType(type);
    setNewMessage(prev => ({
      ...prev,
      recipientId: ''
    }));
  };

  const filteredMessages = messages;

  // Add unread messages count calculation
  const unreadCount = messages.filter(msg => !msg.read).length;

  return (
    <div className="messages-container">
      <Card className="border-0 shadow-sm h-100">
        <Card.Body className="p-0">
          <div className="d-flex" style={{ height: '700px' }}>
            {/* Dossiers de messages */}
            <div className="message-folders">
              <Button
                variant="primary"
                className="w-100 mb-3 mt-3 mx-auto"
                style={{ maxWidth: '90%' }}
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
            <div className="message-list">
              <div className="p-3 border-bottom">
                <InputGroup>
                  <InputGroup.Text className="bg-light border-end-0">
                    <Search size={16} />
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Rechercher..."
                    className="border-start-0 bg-light"
                  />
                </InputGroup>
              </div>

              {loading ? (
                <div className="text-center p-4 text-muted">
                  <div className="spinner-border spinner-border-sm me-2" role="status">
                    <span className="visually-hidden">Chargement...</span>
                  </div>
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
            <div className="message-content">
              {selectedMessage ? (
                <div className="p-3">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0">{selectedMessage.subject}</h5>
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
                    {!selectedMessage.fromAdmin ? (
                      <Button variant="primary" className="me-2">
                        <Send size={16} className="me-2" />
                        Répondre
                      </Button>
                    ) : (
                      <small className="text-muted d-block mb-2">
                        Ce message a été envoyé par un administrateur et ne peut pas recevoir de réponse.
                      </small>
                    )}
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
            <div className="mb-3">
              <div className="btn-group w-100 mb-3">
                <button
                  type="button"
                  className={`btn ${recipientType === 'teacher' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => handleRecipientTypeChange('teacher')}
                >
                  Professeurs
                </button>
                <button
                  type="button"
                  className={`btn ${recipientType === 'student' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => handleRecipientTypeChange('student')}
                >
                  Étudiants
                </button>
              </div>
            </div>

            <Form.Group className="mb-3">
              <Form.Label>Destinataire</Form.Label>
              {recipientType === 'teacher' ? (
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
              ) : (
                <Form.Select
                  name="recipientId"
                  value={newMessage.recipientId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Sélectionnez un étudiant</option>
                  {students.map(student => (
                    <option key={student._id} value={student._id}>
                      {student.fullName}
                    </option>
                  ))}
                </Form.Select>
              )}
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
